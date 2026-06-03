import { useEffect, useState } from 'react'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'
import { timeAgo } from '../lib/format'

type Repair = {
  id: string
  from: string
  feeling: string
  happened: string
  need: string
  mine: string
  at: Date | null
  ack: Record<string, boolean>
}

const FEELINGS = ['Hurt', 'Frustrated', 'Distant', 'Anxious', 'Unheard', 'Sad']

export function RepairFlow() {
  const { couple, partner, profile, paired } = useCouple()
  const { user } = useAuth()
  const coupleId = couple?.id
  const [items, setItems] = useState<Repair[]>([])
  const [open, setOpen] = useState(false)
  const [feeling, setFeeling] = useState('')
  const [happened, setHappened] = useState('')
  const [need, setNeed] = useState('')
  const [mine, setMine] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!db || !coupleId) return
    const q = query(
      collection(db, 'couples', coupleId, 'repairs'),
      orderBy('createdAt', 'desc'),
      limit(5),
    )
    return onSnapshot(q, (snap) =>
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          from: d.data().from ?? '',
          feeling: d.data().feeling ?? '',
          happened: d.data().happened ?? '',
          need: d.data().need ?? '',
          mine: d.data().mine ?? '',
          at: d.data().createdAt?.toDate?.() ?? null,
          ack: d.data().ack ?? {},
        })),
      ),
    )
  }, [coupleId])

  if (!paired) return null

  function reset() {
    setOpen(false)
    setFeeling('')
    setHappened('')
    setNeed('')
    setMine('')
  }

  async function submit() {
    if (!db || !coupleId || !user || !feeling || !need.trim()) return
    setBusy(true)
    try {
      await addDoc(collection(db, 'couples', coupleId, 'repairs'), {
        from: user.uid,
        feeling,
        happened: happened.trim(),
        need: need.trim(),
        mine: mine.trim(),
        ack: {},
        createdAt: serverTimestamp(),
      })
      reset()
    } finally {
      setBusy(false)
    }
  }

  async function acknowledge(r: Repair) {
    if (!db || !coupleId || !user) return
    await updateDoc(doc(db, 'couples', coupleId, 'repairs', r.id), {
      [`ack.${user.uid}`]: true,
    })
  }

  if (open) {
    return (
      <div className="card repair-card">
        <h3 className="card-h muted-h">Repair</h3>
        <p className="entry-empty">A calm way back to each other after a rough patch.</p>

        <label className="repair-label">I’m feeling…</label>
        <div className="repair-feelings">
          {FEELINGS.map((f) => (
            <button
              key={f}
              type="button"
              className={`chip ${feeling === f ? 'chip-on' : ''}`}
              onClick={() => setFeeling(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <label className="repair-label">What happened (just the facts)</label>
        <textarea
          className="input repair-area"
          rows={2}
          value={happened}
          onChange={(e) => setHappened(e.target.value)}
          placeholder="When… I felt…"
        />

        <label className="repair-label">What I need now</label>
        <textarea
          className="input repair-area"
          rows={2}
          value={need}
          onChange={(e) => setNeed(e.target.value)}
          placeholder="It would help if…"
        />

        <label className="repair-label">My part in it</label>
        <textarea
          className="input repair-area"
          rows={2}
          value={mine}
          onChange={(e) => setMine(e.target.value)}
          placeholder="I could have…"
        />

        <div className="row-actions">
          <button type="button" className="btn" onClick={() => void submit()} disabled={busy || !feeling || !need.trim()}>
            {busy ? 'Sending…' : 'Send to ' + (partner?.name || 'partner')}
          </button>
          <button type="button" className="link" onClick={reset}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card repair-card">
      <h3 className="card-h muted-h">Repair</h3>
      {items.length === 0 ? (
        <p className="entry-empty">
          Had a fight? This walks you through a gentle repair — feelings, needs, and owning your part.
        </p>
      ) : (
        <div className="entry-list">
          {items.map((r) => {
            const fromMe = r.from === user?.uid
            const who = fromMe ? 'You' : partner?.name || 'Partner'
            const acked = partner && fromMe ? r.ack[partner.uid] : r.ack[user?.uid ?? '']
            return (
              <div key={r.id} className="repair-item">
                <div className="repair-head">
                  <span className="repair-feel">
                    {who} felt {r.feeling.toLowerCase()}
                  </span>
                  {r.at && <span className="repair-time">{timeAgo(r.at)}</span>}
                </div>
                {r.need && <div className="repair-need">Needs: {r.need}</div>}
                {r.mine && <div className="repair-mine">Owns: {r.mine}</div>}
                {!fromMe && !acked && (
                  <button type="button" className="btn btn-ghost repair-ack" onClick={() => void acknowledge(r)}>
                    I hear you 💛
                  </button>
                )}
                {acked && <div className="repair-done">💛 Heard</div>}
              </div>
            )
          })}
        </div>
      )}
      <button type="button" className="btn" onClick={() => setOpen(true)} disabled={!profile}>
        Start a repair
      </button>
    </div>
  )
}
