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
import { useAuth } from '../auth/AuthProvider'

type Entry = { id: string; text: string; author: string }

export function EntryList({
  name,
  title,
  placeholder,
  emptyText,
  multiline,
}: {
  name: string
  title: string
  placeholder: string
  emptyText: string
  multiline?: boolean
}) {
  const { couple, partner } = useCouple()
  const { user } = useAuth()
  const [items, setItems] = useState<Entry[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const coupleId = couple?.id

  useEffect(() => {
    if (!db || !coupleId) return
    const q = query(collection(db, 'couples', coupleId, name), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          text: d.data().text ?? '',
          author: d.data().author ?? '',
        })),
      )
    })
  }, [coupleId, name])

  async function add(e: FormEvent) {
    e.preventDefault()
    const t = draft.trim()
    if (!t || !db || !coupleId || !user) return
    setBusy(true)
    try {
      await addDoc(collection(db, 'couples', coupleId, name), {
        text: t,
        author: user.uid,
        createdAt: serverTimestamp(),
      })
      setDraft('')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (db && coupleId) await deleteDoc(doc(db, 'couples', coupleId, name, id))
  }

  const who = (a: string) => (a === user?.uid ? 'You' : partner?.name || 'Partner')

  return (
    <div className="card">
      <h3 className="card-h muted-h">{title}</h3>
      <form className="form entry-form" onSubmit={add}>
        {multiline ? (
          <textarea
            className="input entry-textarea"
            placeholder={placeholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
          />
        ) : (
          <input
            className="input"
            type="text"
            placeholder={placeholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        )}
        <button className="btn" type="submit" disabled={busy || !draft.trim()}>
          {busy ? 'Saving…' : 'Add'}
        </button>
      </form>

      {items.length === 0 ? (
        <p className="entry-empty">{emptyText}</p>
      ) : (
        <div className="entry-list">
          {items.map((it) => (
            <div key={it.id} className="entry">
              <div className="entry-body">
                <span className="entry-who">{who(it.author)}</span>
                <span className="entry-text">{it.text}</span>
              </div>
              {it.author === user?.uid && (
                <button
                  type="button"
                  className="entry-del"
                  aria-label="Remove"
                  onClick={() => void remove(it.id)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
