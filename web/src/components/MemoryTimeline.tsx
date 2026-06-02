import { useEffect, useState, type FormEvent } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useCouple } from '../couple/CoupleProvider'
import { prettyDate } from '../lib/format'

type Milestone = { id: string; title: string; date: string; note: string }

export function MemoryTimeline() {
  const { couple } = useCouple()
  const [items, setItems] = useState<Milestone[]>([])
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const coupleId = couple?.id

  useEffect(() => {
    if (!db || !coupleId) return
    return onSnapshot(collection(db, 'couples', coupleId, 'milestones'), (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          title: d.data().title ?? '',
          date: d.data().date ?? '',
          note: d.data().note ?? '',
        })),
      )
    })
  }, [coupleId])

  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))

  async function add(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !date || !db || !coupleId) return
    setBusy(true)
    try {
      await addDoc(collection(db, 'couples', coupleId, 'milestones'), {
        title: title.trim(),
        date,
        note: note.trim(),
        createdAt: serverTimestamp(),
      })
      setTitle('')
      setDate('')
      setNote('')
      setAdding(false)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (db && coupleId) await deleteDoc(doc(db, 'couples', coupleId, 'milestones', id))
  }

  return (
    <div className="card">
      <h3 className="card-h muted-h">Memory timeline</h3>

      {sorted.length === 0 && !adding && (
        <p className="entry-empty">No milestones yet — add the day you met, your first call…</p>
      )}

      <div className="timeline">
        {sorted.map((m) => (
          <div key={m.id} className="tl-item">
            <div className="tl-dot" />
            <div className="tl-body">
              <div className="tl-date">{prettyDate(m.date)}</div>
              <div className="tl-title">{m.title}</div>
              {m.note && <div className="tl-note">{m.note}</div>}
            </div>
            <button
              type="button"
              className="entry-del"
              aria-label="Remove"
              onClick={() => void remove(m.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <form className="form" onSubmit={add}>
          <input
            className="input"
            type="text"
            placeholder="Milestone (e.g. The day we met)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            className="input"
            type="text"
            placeholder="A note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="row-actions">
            <button className="btn" type="submit" disabled={busy || !title.trim() || !date}>
              {busy ? 'Saving…' : 'Add milestone'}
            </button>
            <button type="button" className="link" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-ghost" onClick={() => setAdding(true)}>
          + Add a milestone
        </button>
      )}
    </div>
  )
}
