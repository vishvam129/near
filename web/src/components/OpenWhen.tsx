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
import { useAuth } from '../auth/AuthProvider'

const TRIGGERS = [
  'you miss me',
  'you had a bad day',
  'you can’t sleep',
  'you need a laugh',
  'you’re proud of yourself',
  'just because',
]

type Letter = { id: string; trigger: string; text: string; author: string }

export function OpenWhen() {
  const { couple, partner } = useCouple()
  const { user } = useAuth()
  const [letters, setLetters] = useState<Letter[]>([])
  const [opened, setOpened] = useState<Record<string, boolean>>({})
  const [trigger, setTrigger] = useState(TRIGGERS[0])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [writing, setWriting] = useState(false)
  const coupleId = couple?.id

  useEffect(() => {
    if (!db || !coupleId) return
    return onSnapshot(collection(db, 'couples', coupleId, 'letters'), (snap) => {
      setLetters(
        snap.docs.map((d) => ({
          id: d.id,
          trigger: d.data().trigger ?? '',
          text: d.data().text ?? '',
          author: d.data().author ?? '',
        })),
      )
    })
  }, [coupleId])

  async function add(e: FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t || !db || !coupleId || !user) return
    setBusy(true)
    try {
      await addDoc(collection(db, 'couples', coupleId, 'letters'), {
        trigger,
        text: t,
        author: user.uid,
        createdAt: serverTimestamp(),
      })
      setText('')
      setWriting(false)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (db && coupleId) await deleteDoc(doc(db, 'couples', coupleId, 'letters', id))
  }

  const who = (a: string) => (a === user?.uid ? 'You' : partner?.name || 'Partner')

  return (
    <div className="card">
      <h3 className="card-h muted-h">Open when…</h3>

      {letters.length === 0 && !writing && (
        <p className="entry-empty">No letters yet — write one for a moment they’ll need it.</p>
      )}

      <div className="entry-list">
        {letters.map((l) => (
          <div key={l.id} className="letter">
            <div className="letter-head">
              <span className="letter-trigger">💌 Open when {l.trigger}</span>
              <span className="letter-who">{who(l.author)}</span>
            </div>
            {opened[l.id] ? (
              <div className="letter-text">{l.text}</div>
            ) : (
              <button
                type="button"
                className="link letter-open"
                onClick={() => setOpened((o) => ({ ...o, [l.id]: true }))}
              >
                Open letter
              </button>
            )}
            {l.author === user?.uid && (
              <button
                type="button"
                className="entry-del letter-del"
                aria-label="Remove"
                onClick={() => void remove(l.id)}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {writing ? (
        <form className="form" onSubmit={add}>
          <select className="input" value={trigger} onChange={(e) => setTrigger(e.target.value)}>
            {TRIGGERS.map((t) => (
              <option key={t} value={t}>
                Open when {t}
              </option>
            ))}
          </select>
          <textarea
            className="input entry-textarea"
            rows={3}
            placeholder="Write your letter…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="row-actions">
            <button className="btn" type="submit" disabled={busy || !text.trim()}>
              {busy ? 'Sealing…' : 'Seal letter'}
            </button>
            <button type="button" className="link" onClick={() => setWriting(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-ghost" onClick={() => setWriting(true)}>
          + Write a letter
        </button>
      )}
    </div>
  )
}
