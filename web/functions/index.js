// Cloud Functions for Near — push notifications (#57).
//
// Sends an FCM push to the *other* partner's devices when one of them:
//   • sends a chat message      (couples/{id}/messages create)
//   • pokes / sends a photo / pins a note   (couples/{id} update)
//
// Requires the Blaze plan (Cloud Functions need a billing account on file);
// the actual usage for a two-person couple is comfortably inside the free tier.

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')

initializeApp()
const db = getFirestore()
const APP_URL = 'https://near-d4c7d.web.app'

async function nameOf(uid) {
  try {
    const snap = await db.doc(`users/${uid}`).get()
    return snap.get('name') || 'Your partner'
  } catch {
    return 'Your partner'
  }
}

// Look up the partner's device tokens and send one notification, pruning any
// tokens FCM reports as dead so the list doesn't grow stale forever.
async function notifyPartner(coupleId, senderUid, title, body, tag) {
  const coupleSnap = await db.doc(`couples/${coupleId}`).get()
  const members = coupleSnap.get('members') || []
  const partnerUid = members.find((m) => m !== senderUid)
  if (!partnerUid) return

  const partnerSnap = await db.doc(`users/${partnerUid}`).get()
  const tokens = partnerSnap.get('fcmTokens') || []
  if (!tokens.length) return

  const res = await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: { tag, link: APP_URL },
    webpush: { fcmOptions: { link: APP_URL } },
  })

  const dead = []
  res.responses.forEach((r, i) => {
    const code = r.success ? null : r.error && r.error.code
    if (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-argument'
    ) {
      dead.push(tokens[i])
    }
  })
  if (dead.length) {
    await partnerSnap.ref.update({ fcmTokens: FieldValue.arrayRemove(...dead) })
  }
}

exports.onMessage = onDocumentCreated(
  'couples/{coupleId}/messages/{messageId}',
  async (event) => {
    const m = event.data && event.data.data()
    if (!m || !m.from) return
    const name = await nameOf(m.from)
    let body = (m.text || '').trim()
    if (!body) body = m.imageUrl ? '📷 Photo' : m.audioUrl ? '🎤 Voice message' : 'New message'
    await notifyPartner(event.params.coupleId, m.from, `💬 ${name}`, body, 'message')
  },
)

// Fires on every couples-doc update but only *sends* when a signal's timestamp
// actually advances, so routine writes (typing, watch sync) cost nothing.
exports.onCoupleSignal = onDocumentUpdated('couples/{coupleId}', async (event) => {
  const before = (event.data && event.data.before.data()) || {}
  const after = (event.data && event.data.after.data()) || {}
  const ms = (v) => (v && v.toMillis ? v.toMillis() : 0)
  const coupleId = event.params.coupleId

  const checks = [
    {
      key: 'poke',
      title: '💗 Thinking of you',
      body: (n) => `${n} is thinking of you`,
      tag: 'poke',
    },
    { key: 'photoWidget', title: '📸 New photo', body: (n) => `${n} sent you a photo`, tag: 'photo' },
    {
      key: 'pinnedNote',
      title: '💌 Love note',
      body: (n) => `${n} pinned a note for you`,
      tag: 'note',
    },
  ]

  for (const c of checks) {
    const sig = after[c.key]
    if (sig && sig.from && ms(sig.at) > ms((before[c.key] || {}).at)) {
      const name = await nameOf(sig.from)
      await notifyPartner(coupleId, sig.from, c.title, c.body(name), c.tag)
      return // one push per update is plenty
    }
  }
})
