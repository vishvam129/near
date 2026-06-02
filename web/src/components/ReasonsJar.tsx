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

type Reason = { id: string; text: string; author: string }

export function ReasonsJar() {
  const { couple, partner } = useCouple()
  const { user } = useAuth()
  const [reasons, setReasons] = useState<Reason[]>([])
  const [pulled, setPulled] = useState<Reason | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [managing, setManaging] = useState(false)
  const coupleId = couple?.id

  useEffect(() => {
    if (!db || !coupleId) return
    return onSnapshot(collection(db, 'couples', coupleId, 'reasons'), (snap) => {
      setReasons(
        snap.docs.map((d) => ({
          id: d.id,
          text: d.data().text ?? '',
          author: d.data().author ?? '',
        })),
      )
    })
  }, [coupleId])

  function pull() {
    if (reasons.length === 0) return
    let next = pulled
    while ((next === pulled || (pulled && next?.id === pulled.id)) && reasons.length > 1) {
      next = reasons[Math.floor(Math.random() * reasons.length)]
    }
    setPulled(next ?? reasons[0])
  }

  async function add(e: FormEvent) {
    e.preventDefault()
    const t = draft.trim()
    if (!t || !db || !coupleId || !user) return
    setBusy(true)
    try {
      await addDoc(collection(db, 'couples', coupleId, 'reasons'), {
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
    if (db && coupleId) await deleteDoc(doc(db, 'couples', coupleId, 'reasons', id))
  }

  const who = (a: string) => (a === user?.uid ? 'You' : partner?.name || 'Partner')

  return (
    <div className="card reasons">
      <h3 className="card-h muted-h">Reasons I love you 🫙</h3>

      {pulled ? (
        <div className="reason-pulled">
          “{pulled.text}”<span className="reason-by">— {who(pulled.author)}</span>
        </div>
      ) : (
        <p className="entry-empty">
          {reasons.length === 0
            ? 'Add a few reasons, then pull one out anytime.'
            : `${reasons.length} reason${reasons.length === 1 ? '' : 's'} in the jar.`}
        </p>
      )}

      <div className="row-actions">
        <button type="button" className="btn" onClick={pull} disabled={reasons.length === 0}>
          Pull a reason 🫙
        </button>
        <button type="button" className="link" onClick={() => setManaging((m) => !m)}>
          {managing ? 'Done' : 'Add / manage'}
        </button>
      </div>

      {managing && (
        <>
          <form className="form entry-form reasons-add" onSubmit={add}>
            <input
              className="input"
              type="text"
              placeholder="Why you love them…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button className="btn" type="submit" disabled={busy || !draft.trim()}>
              {busy ? '…' : 'Add'}
            </button>
          </form>
          <div className="entry-list">
            {reasons.map((r) => (
              <div key={r.id} className="entry">
                <div className="entry-body">
                  <span className="entry-who">{who(r.author)}</span>
                  <span className="entry-text">{r.text}</span>
                </div>
                {r.author === user?.uid && (
                  <button
                    type="button"
                    className="entry-del"
                    aria-label="Remove"
                    onClick={() => void remove(r.id)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
