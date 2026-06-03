import { useEffect, useState, type FormEvent } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useCouple } from '../couple/CoupleProvider'

type Goal = { id: string; text: string; target: number; progress: number }

export function CoopGoals() {
  const { couple } = useCouple()
  const coupleId = couple?.id
  const [goals, setGoals] = useState<Goal[]>([])
  const [text, setText] = useState('')
  const [target, setTarget] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!db || !coupleId) return
    return onSnapshot(collection(db, 'couples', coupleId, 'goals'), (snap) =>
      setGoals(
        snap.docs.map((d) => ({
          id: d.id,
          text: d.data().text ?? '',
          target: Number(d.data().target) || 1,
          progress: Number(d.data().progress) || 0,
        })),
      ),
    )
  }, [coupleId])

  async function add(e: FormEvent) {
    e.preventDefault()
    const t = Number(target)
    if (!text.trim() || !t || t <= 0 || !db || !coupleId) return
    setBusy(true)
    try {
      await addDoc(collection(db, 'couples', coupleId, 'goals'), {
        text: text.trim(),
        target: t,
        progress: 0,
        createdAt: serverTimestamp(),
      })
      setText('')
      setTarget('')
    } finally {
      setBusy(false)
    }
  }

  async function bump(g: Goal, amt: number) {
    if (!db || !coupleId) return
    const ref = doc(db, 'couples', coupleId, 'goals', g.id)
    // Re-read inside a transaction so concurrent taps from both partners
    // can't push progress past the target (or below zero).
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists()) return
      const cur = Number(snap.data().progress) || 0
      const tgt = Number(snap.data().target) || 1
      const next = Math.max(0, Math.min(tgt, cur + amt))
      if (next !== cur) tx.update(ref, { progress: next })
    })
  }

  async function remove(id: string) {
    if (db && coupleId) await deleteDoc(doc(db, 'couples', coupleId, 'goals', id))
  }

  return (
    <div className="card">
      <h3 className="card-h muted-h">Shared goals</h3>
      <form className="form entry-form" onSubmit={add}>
        <input
          className="input"
          type="text"
          placeholder="Goal (e.g. Workout)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input
          className="input expense-amount"
          type="number"
          inputMode="numeric"
          placeholder="Target"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <button className="btn" type="submit" disabled={busy || !text.trim() || !Number(target)}>
          Add
        </button>
      </form>

      {goals.length === 0 ? (
        <p className="entry-empty">Set a goal you’ll reach together — count it up as you go.</p>
      ) : (
        <div className="entry-list">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.progress / g.target) * 100))
            const done = g.progress >= g.target
            return (
              <div key={g.id} className="goal">
                <div className="goal-top">
                  <span className="goal-text">
                    {g.text} {done && '🎉'}
                  </span>
                  <span className="goal-count">
                    {g.progress}/{g.target}
                  </span>
                  <button
                    type="button"
                    className="entry-del"
                    aria-label="Remove"
                    onClick={() => void remove(g.id)}
                  >
                    ✕
                  </button>
                </div>
                <div className="savings-bar">
                  <i style={{ width: `${pct}%` }} />
                </div>
                <div className="goal-actions">
                  <button type="button" className="link" onClick={() => void bump(g, -1)}>
                    −1
                  </button>
                  <button type="button" className="btn goal-add" onClick={() => void bump(g, 1)}>
                    +1
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
