import { useEffect, useState, type FormEvent } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'
import { utcDayKey } from '../lib/format'

type Pact = { id: string; title: string; target: number; log: Record<string, string[]> }

// Count distinct days each partner logged toward the pact.
function daysFor(log: Record<string, string[]>, uid: string): number {
  return Object.values(log).filter((uids) => uids.includes(uid)).length
}

export function FitnessPact() {
  const { couple, partner, paired } = useCouple()
  const { user } = useAuth()
  const coupleId = couple?.id
  const [pacts, setPacts] = useState<Pact[]>([])
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [busy, setBusy] = useState(false)
  const today = utcDayKey(0)

  useEffect(() => {
    if (!db || !coupleId) return
    return onSnapshot(collection(db, 'couples', coupleId, 'pacts'), (snap) =>
      setPacts(
        snap.docs.map((d) => ({
          id: d.id,
          title: d.data().title ?? '',
          target: Number(d.data().target) || 1,
          log: d.data().log ?? {},
        })),
      ),
    )
  }, [coupleId])

  if (!paired) return null

  async function add(e: FormEvent) {
    e.preventDefault()
    const t = Number(target)
    if (!title.trim() || !t || t <= 0 || !db || !coupleId) return
    setBusy(true)
    try {
      await addDoc(collection(db, 'couples', coupleId, 'pacts'), {
        title: title.trim(),
        target: t,
        log: {},
        createdAt: serverTimestamp(),
      })
      setTitle('')
      setTarget('')
    } finally {
      setBusy(false)
    }
  }

  async function logToday(p: Pact) {
    if (!db || !coupleId || !user) return
    const did = (p.log[today] ?? []).includes(user.uid)
    await updateDoc(doc(db, 'couples', coupleId, 'pacts', p.id), {
      [`log.${today}`]: did ? arrayRemove(user.uid) : arrayUnion(user.uid),
    })
  }

  async function remove(id: string) {
    if (db && coupleId) await deleteDoc(doc(db, 'couples', coupleId, 'pacts', id))
  }

  return (
    <div className="card">
      <h3 className="card-h muted-h">Fitness pact</h3>
      <form className="form entry-form" onSubmit={add}>
        <input
          className="input"
          type="text"
          placeholder="Challenge (e.g. Move every day)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="input expense-amount"
          type="number"
          inputMode="numeric"
          placeholder="Days"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <button className="btn" type="submit" disabled={busy || !title.trim() || !Number(target)}>
          Add
        </button>
      </form>

      {pacts.length === 0 ? (
        <p className="entry-empty">Make a pact you’ll keep together — log a day each time you move.</p>
      ) : (
        <div className="entry-list">
          {pacts.map((p) => {
            const mine = user ? daysFor(p.log, user.uid) : 0
            const theirs = partner ? daysFor(p.log, partner.uid) : 0
            const combined = mine + theirs
            const pct = Math.min(100, Math.round((combined / (p.target * 2)) * 100))
            const didToday = user ? (p.log[today] ?? []).includes(user.uid) : false
            return (
              <div key={p.id} className="goal pact">
                <div className="goal-top">
                  <span className="goal-text">{p.title}</span>
                  <span className="goal-count">
                    {combined}/{p.target * 2} days
                  </span>
                  <button
                    type="button"
                    className="entry-del"
                    aria-label="Remove"
                    onClick={() => void remove(p.id)}
                  >
                    ✕
                  </button>
                </div>
                <div className="savings-bar">
                  <i style={{ width: `${pct}%` }} />
                </div>
                <div className="pact-tally">
                  <span>
                    You: <b>{mine}</b>
                  </span>
                  <span>
                    {partner?.name || 'Partner'}: <b>{theirs}</b>
                  </span>
                </div>
                <button
                  type="button"
                  className={`btn ${didToday ? 'btn-ghost' : ''} pact-log`}
                  onClick={() => void logToday(p)}
                >
                  {didToday ? '✓ Logged today' : 'Log today'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
