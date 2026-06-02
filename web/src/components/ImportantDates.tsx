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

type DateItem = { id: string; label: string; date: string }

// Next yearly occurrence of a 'YYYY-MM-DD' (recurring anniversary/birthday).
function nextOccurrence(dateStr: string): Date | null {
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  const now = new Date()
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let next = new Date(now.getFullYear(), d.getMonth(), d.getDate())
  if (next < today0) next = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate())
  return next
}

function daysUntil(next: Date): number {
  const now = new Date()
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((next.getTime() - today0.getTime()) / 86_400_000)
}

function toDateInput(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function ImportantDates() {
  const { couple } = useCouple()
  const [items, setItems] = useState<DateItem[]>([])
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [date, setDate] = useState('')
  const [busy, setBusy] = useState(false)

  const coupleId = couple?.id
  useEffect(() => {
    if (!db || !coupleId) return
    return onSnapshot(collection(db, 'couples', coupleId, 'dates'), (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          label: d.data().label ?? '',
          date: d.data().date ?? '',
        })),
      )
    })
  }, [coupleId])

  const sorted = [...items]
    .map((it) => ({ ...it, next: nextOccurrence(it.date) }))
    .filter((it) => it.next)
    .sort((a, b) => (a.next as Date).getTime() - (b.next as Date).getTime())

  async function add(e: FormEvent) {
    e.preventDefault()
    if (!label.trim() || !date || !db || !coupleId) return
    setBusy(true)
    try {
      await addDoc(collection(db, 'couples', coupleId, 'dates'), {
        label: label.trim(),
        date,
        createdAt: serverTimestamp(),
      })
      setLabel('')
      setDate('')
      setAdding(false)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (!db || !coupleId) return
    await deleteDoc(doc(db, 'couples', coupleId, 'dates', id))
  }

  return (
    <div className="card dates">
      <h3 className="card-h muted-h">Important dates</h3>

      {sorted.length === 0 && !adding && (
        <p className="dates-empty">No dates yet — add your anniversary or a birthday.</p>
      )}

      <div className="dates-list">
        {sorted.map((it) => {
          const days = daysUntil(it.next as Date)
          return (
            <div key={it.id} className="date-row">
              <div className="date-info">
                <span className="date-label">{it.label}</span>
                <span className="date-when">
                  {prettyDate(toDateInput(it.next as Date))} ·{' '}
                  {days === 0 ? 'today 🎉' : `in ${days} ${days === 1 ? 'day' : 'days'}`}
                </span>
              </div>
              <button
                type="button"
                className="date-del"
                aria-label="Remove"
                onClick={() => void remove(it.id)}
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>

      {adding ? (
        <form className="form dates-form" onSubmit={add}>
          <input
            className="input"
            type="text"
            placeholder="e.g. Our anniversary"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="row-actions">
            <button className="btn" type="submit" disabled={busy || !label.trim() || !date}>
              {busy ? 'Saving…' : 'Add date'}
            </button>
            <button type="button" className="link" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-ghost dates-add" onClick={() => setAdding(true)}>
          + Add a date
        </button>
      )}
    </div>
  )
}
