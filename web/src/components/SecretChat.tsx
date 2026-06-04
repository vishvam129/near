import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'
import { deriveKey, encryptText, decryptText } from '../lib/crypto'

type Enc = { id: string; ct: string; iv: string; by: string }
type Shown = { id: string; text: string | null; mine: boolean }

export function SecretChat() {
  const { user } = useAuth()
  const { couple, paired } = useCouple()
  const coupleId = couple?.id
  // The key lives in state (not a ref) so the decrypt effect re-runs the moment
  // it arrives — a ref mutation wouldn't re-trigger the effect.
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [raw, setRaw] = useState<Enc[]>([])
  const [shown, setShown] = useState<Shown[]>([])
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const storeKey = coupleId ? `near_secret_pass_${coupleId}` : ''

  // Auto-unlock if this device remembered the passphrase.
  useEffect(() => {
    if (!coupleId || unlocked) return
    const saved = localStorage.getItem(storeKey)
    if (!saved) return
    deriveKey(saved, coupleId).then((k) => {
      setCryptoKey(k)
      setUnlocked(true)
    })
  }, [coupleId, unlocked, storeKey])

  // Subscribe to the encrypted thread once unlocked.
  useEffect(() => {
    if (!db || !coupleId || !unlocked) return
    const q = query(
      collection(db, 'couples', coupleId, 'secret'),
      orderBy('createdAt', 'asc'),
      limit(200),
    )
    return onSnapshot(q, (snap) =>
      setRaw(
        snap.docs.map((d) => ({
          id: d.id,
          ct: d.data().ct ?? '',
          iv: d.data().iv ?? '',
          by: d.data().by ?? '',
        })),
      ),
    )
  }, [coupleId, unlocked])

  // Decrypt whenever the ciphertext list OR the key changes.
  useEffect(() => {
    let cancelled = false
    if (!cryptoKey) return
    Promise.all(
      raw.map(async (m) => ({
        id: m.id,
        text: await decryptText(m.ct, m.iv, cryptoKey),
        mine: m.by === user?.uid,
      })),
    ).then((out) => {
      if (!cancelled) setShown(out)
    })
    return () => {
      cancelled = true
    }
  }, [raw, user?.uid, cryptoKey])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [shown])

  if (!paired) return null

  async function unlock(remember: boolean) {
    if (!coupleId || pass.length < 6) return
    setBusy(true)
    try {
      setCryptoKey(await deriveKey(pass, coupleId))
      if (remember) localStorage.setItem(storeKey, pass)
      setUnlocked(true)
      setPass('')
    } finally {
      setBusy(false)
    }
  }

  function forget() {
    localStorage.removeItem(storeKey)
    setCryptoKey(null)
    setUnlocked(false)
    setRaw([])
    setShown([])
  }

  async function send(e: FormEvent) {
    e.preventDefault()
    const key = cryptoKey
    if (!key || !db || !coupleId || !user || !text.trim()) return
    const { ct, iv } = await encryptText(text.trim(), key)
    setText('')
    await addDoc(collection(db, 'couples', coupleId, 'secret'), {
      ct,
      iv,
      by: user.uid,
      createdAt: serverTimestamp(),
    })
  }

  if (!unlocked) {
    return (
      <div className="card">
        <h3 className="card-h muted-h">Secret chat 🔐</h3>
        <p className="entry-empty">
          End-to-end encrypted. Agree a passphrase together (say it in person or on a call) — it’s
          never sent anywhere, so only your two devices can read these messages.
        </p>
        <input
          className="input"
          type="password"
          placeholder="Shared passphrase (6+ chars)"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />
        <div className="row-actions">
          <button type="button" className="btn" onClick={() => void unlock(true)} disabled={busy || pass.length < 6}>
            Unlock &amp; remember
          </button>
          <button type="button" className="link" onClick={() => void unlock(false)} disabled={busy || pass.length < 6}>
            Just this time
          </button>
        </div>
      </div>
    )
  }

  const anyFailed = shown.some((m) => m.text === null)

  return (
    <div className="card secret-chat">
      <h3 className="card-h muted-h">Secret chat 🔓</h3>
      {anyFailed && (
        <p className="entry-empty">
          🔒 Some messages won’t decrypt — they were sent with a different passphrase.
        </p>
      )}
      <div className="secret-thread">
        {shown.length === 0 ? (
          <p className="entry-empty">No secret messages yet.</p>
        ) : (
          shown.map((m) => (
            <div key={m.id} className={`secret-bubble ${m.mine ? 'mine' : 'theirs'}`}>
              {m.text === null ? <span className="secret-locked">🔒 locked</span> : m.text}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
      <form className="form entry-form" onSubmit={send}>
        <input
          className="input"
          type="text"
          placeholder="Encrypted message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn" type="submit" disabled={!text.trim()}>
          Send
        </button>
      </form>
      <button type="button" className="link" onClick={forget}>
        Lock &amp; forget passphrase on this device
      </button>
    </div>
  )
}
