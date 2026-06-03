import { useEffect, useState, type FormEvent } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useCouple } from '../couple/CoupleProvider'
import { useAuth } from '../auth/AuthProvider'
import { prettyDate } from '../lib/format'

type Capsule = { id: string; text: string; from: string; unlockAt: Date | null }

function defaultUnlock(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function TimeCapsule() {
  const { couple, partner } = useCouple()
  const { user } = useAuth()
  const [items, setItems] = useState<Capsule[]>([])
  const [text, setText] = useState('')
  const [date, setDate] = useState(defaultUnlock())
  const [writing, setWriting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const coupleId = couple?.id

  useEffect(() => {
    if (!db || !coupleId) return
    return onSnapshot(collection(db, 'couples', coupleId, 'capsules'), (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          text: d.data().text ?? '',
          from: d.data().from ?? '',
          unlockAt: d.data().unlockAt?.toDate?.() ?? null,
        })),
      )
    })
  }, [coupleId])

  const sorted = [...items].sort(
    (a, b) => (a.unlockAt?.getTime() ?? 0) - (b.unlockAt?.getTime() ?? 0),
  )
  const who = (a: string) => (a === user?.uid ? 'You' : partner?.name || 'Partner')

  async function add(e: FormEvent) {
    e.preventDefault()
    const t = text.trim()
    const at = new Date(date)
    if (!t || isNaN(at.getTime()) || !db || !coupleId || !user) return
    if (at.getTime() <= Date.now()) {
      setErr('Pick a future unlock date.')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      await addDoc(collection(db, 'couples', coupleId, 'capsules'), {
        text: t,
        from: user.uid,
        unlockAt: Timestamp.fromDate(at),
        createdAt: serverTimestamp(),
      })
      setText('')
      setDate(defaultUnlock())
      setWriting(false)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (db && coupleId) await deleteDoc(doc(db, 'couples', coupleId, 'capsules', id))
  }

  return (
    <div className="card">
      <h3 className="card-h muted-h">Time capsule</h3>

      {sorted.length === 0 && !writing && (
        <p className="entry-empty">Write a message that unlocks on a future date.</p>
      )}

      <div className="entry-list">
        {sorted.map((c) => {
          const locked = c.unlockAt && c.unlockAt.getTime() > Date.now()
          return (
            <div key={c.id} className="capsule">
              {locked ? (
                <div className="capsule-locked">
                  🔒 Sealed until {c.unlockAt ? prettyDate(toKey(c.unlockAt)) : '…'}
                  <span className="capsule-who">{who(c.from)}</span>
                </div>
              ) : (
                <div className="capsule-open">
                  <span className="capsule-who">{who(c.from)} · unlocked</span>
                  <span className="capsule-text">{c.text}</span>
                </div>
              )}
              {c.from === user?.uid && (
                <button
                  type="button"
                  className="entry-del capsule-del"
                  aria-label="Remove"
                  onClick={() => void remove(c.id)}
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}
      </div>

      {writing ? (
        <form className="form" onSubmit={add}>
          <textarea
            className="input entry-textarea"
            rows={3}
            placeholder="A message for the future…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <label className="field">
            <span className="field-label">Unlocks on</span>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          {err && <div className="err">{err}</div>}
          <div className="row-actions">
            <button className="btn" type="submit" disabled={busy || !text.trim()}>
              {busy ? 'Sealing…' : 'Seal capsule'}
            </button>
            <button type="button" className="link" onClick={() => setWriting(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-ghost" onClick={() => setWriting(true)}>
          + New capsule
        </button>
      )}
    </div>
  )
}

function toKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
