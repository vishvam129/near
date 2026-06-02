import { useEffect, useState, type FormEvent } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useCouple } from '../couple/CoupleProvider'

type Item = { id: string; text: string; done: boolean }

/** Shared, checkable list backed by couples/{id}/{name}. Used for bucket list & to-dos. */
export function CheckList({
  name,
  title,
  placeholder,
  emptyText,
}: {
  name: string
  title: string
  placeholder: string
  emptyText: string
}) {
  const { couple } = useCouple()
  const [items, setItems] = useState<Item[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const coupleId = couple?.id

  useEffect(() => {
    if (!db || !coupleId) return
    return onSnapshot(collection(db, 'couples', coupleId, name), (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          text: d.data().text ?? '',
          done: Boolean(d.data().done),
        })),
      )
    })
  }, [coupleId, name])

  const sorted = [...items].sort((a, b) => Number(a.done) - Number(b.done))

  async function add(e: FormEvent) {
    e.preventDefault()
    const t = draft.trim()
    if (!t || !db || !coupleId) return
    setBusy(true)
    try {
      await addDoc(collection(db, 'couples', coupleId, name), {
        text: t,
        done: false,
        createdAt: serverTimestamp(),
      })
      setDraft('')
    } finally {
      setBusy(false)
    }
  }

  async function toggle(it: Item) {
    if (db && coupleId)
      await updateDoc(doc(db, 'couples', coupleId, name, it.id), { done: !it.done })
  }

  async function remove(id: string) {
    if (db && coupleId) await deleteDoc(doc(db, 'couples', coupleId, name, id))
  }

  return (
    <div className="card">
      <h3 className="card-h muted-h">{title}</h3>
      <form className="form entry-form" onSubmit={add}>
        <input
          className="input"
          type="text"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn" type="submit" disabled={busy || !draft.trim()}>
          {busy ? 'Saving…' : 'Add'}
        </button>
      </form>

      {sorted.length === 0 ? (
        <p className="entry-empty">{emptyText}</p>
      ) : (
        <div className="entry-list">
          {sorted.map((it) => (
            <div key={it.id} className={`bucket-item ${it.done ? 'done' : ''}`}>
              <button
                type="button"
                className="bucket-check"
                aria-label="Toggle done"
                onClick={() => void toggle(it)}
              >
                {it.done ? '✓' : ''}
              </button>
              <span className="bucket-text">{it.text}</span>
              <button
                type="button"
                className="entry-del"
                aria-label="Remove"
                onClick={() => void remove(it.id)}
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
