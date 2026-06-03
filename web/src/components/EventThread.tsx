import { useEffect, useState, type FormEvent } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'

type Comment = { id: string; text: string; author: string }

export function EventThread({ eventId }: { eventId: string }) {
  const { couple, partner } = useCouple()
  const { user } = useAuth()
  const coupleId = couple?.id
  const [items, setItems] = useState<Comment[]>([])
  const [text, setText] = useState('')

  useEffect(() => {
    if (!db || !coupleId) return
    const q = query(
      collection(db, 'couples', coupleId, 'events', eventId, 'comments'),
      orderBy('createdAt', 'asc'),
    )
    return onSnapshot(q, (snap) =>
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          text: d.data().text ?? '',
          author: d.data().author ?? '',
        })),
      ),
    )
  }, [coupleId, eventId])

  async function add(e: FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t || !db || !coupleId || !user) return
    setText('')
    await addDoc(collection(db, 'couples', coupleId, 'events', eventId, 'comments'), {
      text: t,
      author: user.uid,
      createdAt: serverTimestamp(),
    })
  }

  const who = (a: string) => (a === user?.uid ? 'You' : partner?.name || 'Partner')

  return (
    <div className="event-thread">
      {items.map((c) => (
        <div key={c.id} className="ev-comment">
          <span className="ev-who">{who(c.author)}</span> {c.text}
        </div>
      ))}
      <form className="watch-chat-form" onSubmit={add}>
        <input
          className="input"
          type="text"
          placeholder="Comment…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="composer-send" type="submit" aria-label="Send">
          ➤
        </button>
      </form>
    </div>
  )
}
