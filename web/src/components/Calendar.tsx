import { useEffect, useState, type FormEvent } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useCouple } from '../couple/CoupleProvider'
import { EventThread } from './EventThread'

type Ev = { id: string; title: string; when: string }

function fmt(when: string): string {
  const d = new Date(when)
  if (isNaN(d.getTime())) return when
  return new Intl.DateTimeFormat([], { dateStyle: 'medium', timeStyle: 'short' }).format(d)
}

export function Calendar() {
  const { couple } = useCouple()
  const coupleId = couple?.id
  const [items, setItems] = useState<Ev[]>([])
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState('')
  const [busy, setBusy] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    if (!db || !coupleId) return
    const q = query(collection(db, 'couples', coupleId, 'events'), orderBy('when', 'asc'))
    return onSnapshot(q, (snap) =>
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          title: d.data().title ?? '',
          when: d.data().when ?? '',
        })),
      ),
    )
  }, [coupleId])

  async function add(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !when || !db || !coupleId) return
    setBusy(true)
    try {
      await addDoc(collection(db, 'couples', coupleId, 'events'), {
        title: title.trim(),
        when,
        createdAt: serverTimestamp(),
      })
      setTitle('')
      setWhen('')
      setAdding(false)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (db && coupleId) await deleteDoc(doc(db, 'couples', coupleId, 'events', id))
  }

  return (
    <div className="card">
      <h3 className="card-h muted-h">Shared calendar</h3>

      {items.length === 0 && !adding && (
        <p className="entry-empty">No events yet — add a call, a visit, a date night.</p>
      )}

      <div className="entry-list">
        {items.map((ev) => (
          <div key={ev.id} className="cal-event">
            <div className="cal-row">
              <div className="entry-body">
                <span className="entry-who">{fmt(ev.when)}</span>
                <span className="entry-text">{ev.title}</span>
              </div>
              <button
                type="button"
                className="link cal-comments"
                onClick={() => setOpenId(openId === ev.id ? null : ev.id)}
              >
                {openId === ev.id ? 'Hide' : '💬'}
              </button>
              <button
                type="button"
                className="entry-del"
                aria-label="Remove"
                onClick={() => void remove(ev.id)}
              >
                ✕
              </button>
            </div>
            {openId === ev.id && <EventThread eventId={ev.id} />}
          </div>
        ))}
      </div>

      {adding ? (
        <form className="form" onSubmit={add}>
          <input
            className="input"
            type="text"
            placeholder="Event (e.g. Movie night)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="input"
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />
          <div className="row-actions">
            <button className="btn" type="submit" disabled={busy || !title.trim() || !when}>
              {busy ? 'Saving…' : 'Add event'}
            </button>
            <button type="button" className="link" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-ghost" onClick={() => setAdding(true)}>
          + Add event
        </button>
      )}
    </div>
  )
}
