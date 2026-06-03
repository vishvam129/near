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
import { toDateInput } from '../lib/format'

type Habit = { id: string; name: string; log: Record<string, string[]> }

function dayKey(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return toDateInput(d)
}

function streakFor(log: Record<string, string[]>, uid: string): number {
  const done = (k: string) => (log[k] ?? []).includes(uid)
  let off = done(dayKey(0)) ? 0 : -1 // today still counts even if not done yet
  let n = 0
  while (done(dayKey(off))) {
    n++
    off--
  }
  return n
}

export function HabitTracker() {
  const { couple, partner } = useCouple()
  const { user } = useAuth()
  const coupleId = couple?.id
  const [habits, setHabits] = useState<Habit[]>([])
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const today = dayKey(0)

  useEffect(() => {
    if (!db || !coupleId) return
    return onSnapshot(collection(db, 'couples', coupleId, 'habits'), (snap) =>
      setHabits(
        snap.docs.map((d) => ({ id: d.id, name: d.data().name ?? '', log: d.data().log ?? {} })),
      ),
    )
  }, [coupleId])

  async function add(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !db || !coupleId) return
    setBusy(true)
    try {
      await addDoc(collection(db, 'couples', coupleId, 'habits'), {
        name: name.trim(),
        log: {},
        createdAt: serverTimestamp(),
      })
      setName('')
    } finally {
      setBusy(false)
    }
  }

  async function toggle(h: Habit) {
    if (!db || !coupleId || !user) return
    const mineDone = (h.log[today] ?? []).includes(user.uid)
    await updateDoc(doc(db, 'couples', coupleId, 'habits', h.id), {
      [`log.${today}`]: mineDone ? arrayRemove(user.uid) : arrayUnion(user.uid),
    })
  }

  async function remove(id: string) {
    if (db && coupleId) await deleteDoc(doc(db, 'couples', coupleId, 'habits', id))
  }

  return (
    <div className="card">
      <h3 className="card-h muted-h">Habits together</h3>
      <form className="form entry-form" onSubmit={add}>
        <input
          className="input"
          type="text"
          placeholder="A habit (e.g. Drink water)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn" type="submit" disabled={busy || !name.trim()}>
          Add
        </button>
      </form>

      {habits.length === 0 ? (
        <p className="entry-empty">Add a habit you’ll both build together.</p>
      ) : (
        <div className="entry-list">
          {habits.map((h) => {
            const mineDone = user ? (h.log[today] ?? []).includes(user.uid) : false
            const theirsDone = partner ? (h.log[today] ?? []).includes(partner.uid) : false
            const streak = user ? streakFor(h.log, user.uid) : 0
            return (
              <div key={h.id} className="habit">
                <div className="habit-info">
                  <span className="habit-name">{h.name}</span>
                  <span className="habit-meta">
                    {streak > 0 && <>🔥 {streak} </>}
                    {theirsDone && <>· {partner?.name || 'partner'} ✓</>}
                  </span>
                </div>
                <button
                  type="button"
                  className={`habit-check ${mineDone ? 'done' : ''}`}
                  onClick={() => void toggle(h)}
                >
                  {mineDone ? '✓' : 'Today'}
                </button>
                <button
                  type="button"
                  className="entry-del"
                  aria-label="Remove"
                  onClick={() => void remove(h.id)}
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
