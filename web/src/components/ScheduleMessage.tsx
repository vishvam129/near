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

type Scheduled = { id: string; text: string; from: string; deliverAt: Date | null; delivered: boolean }

function localNowValue(): string {
  const d = new Date(Date.now() + 60_000) // default 1 min ahead
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ScheduleMessage() {
  const { couple } = useCouple()
  const { user } = useAuth()
  const [pending, setPending] = useState<Scheduled[]>([])
  const [text, setText] = useState('')
  const [when, setWhen] = useState(localNowValue())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const coupleId = couple?.id

  useEffect(() => {
    if (!db || !coupleId) return
    return onSnapshot(collection(db, 'couples', coupleId, 'scheduled'), (snap) => {
      setPending(
        snap.docs
          .map((d) => ({
            id: d.id,
            text: d.data().text ?? '',
            from: d.data().from ?? '',
            deliverAt: d.data().deliverAt?.toDate?.() ?? null,
            delivered: Boolean(d.data().delivered),
          }))
          .filter((s) => !s.delivered && s.from === user?.uid)
          .sort((a, b) => (a.deliverAt?.getTime() ?? 0) - (b.deliverAt?.getTime() ?? 0)),
      )
    })
  }, [coupleId, user?.uid])

  async function add(e: FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t || !db || !coupleId || !user) return
    const at = new Date(when)
    if (isNaN(at.getTime()) || at.getTime() <= Date.now()) {
      setError('Pick a time in the future.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await addDoc(collection(db, 'couples', coupleId, 'scheduled'), {
        text: t,
        from: user.uid,
        deliverAt: Timestamp.fromDate(at),
        delivered: false,
        createdAt: serverTimestamp(),
      })
      setText('')
      setWhen(localNowValue())
    } finally {
      setBusy(false)
    }
  }

  async function cancel(id: string) {
    if (db && coupleId) await deleteDoc(doc(db, 'couples', coupleId, 'scheduled', id))
  }

  return (
    <div className="card">
      <h3 className="card-h muted-h">Schedule a surprise message</h3>
      <form className="form" onSubmit={add}>
        <input
          className="input"
          type="text"
          placeholder="Message to send later…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input
          className="input"
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
        />
        {error && <div className="err">{error}</div>}
        <button className="btn" type="submit" disabled={busy || !text.trim()}>
          {busy ? 'Scheduling…' : 'Schedule it'}
        </button>
      </form>

      {pending.length > 0 && (
        <div className="entry-list scheduled-list">
          {pending.map((s) => (
            <div key={s.id} className="entry">
              <div className="entry-body">
                <span className="entry-who">
                  {s.deliverAt
                    ? new Intl.DateTimeFormat([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(s.deliverAt)
                    : 'soon'}
                </span>
                <span className="entry-text">{s.text}</span>
              </div>
              <button
                type="button"
                className="entry-del"
                aria-label="Cancel"
                onClick={() => void cancel(s.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
