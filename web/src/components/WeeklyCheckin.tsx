import { useEffect, useState, type FormEvent } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'

const FACES = ['😞', '😕', '😐', '🙂', '😄']

function weekKey(): string {
  const d = new Date()
  const day = (d.getUTCDay() + 6) % 7 // 0 = Monday
  d.setUTCDate(d.getUTCDate() - day)
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${d.getUTCFullYear()}-${m}-${dd}`
}

export function WeeklyCheckin() {
  const { user } = useAuth()
  const { couple, partner } = useCouple()
  const key = weekKey()
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [rating, setRating] = useState(0)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const coupleId = couple?.id

  useEffect(() => {
    if (!db || !coupleId) return
    return onSnapshot(doc(db, 'couples', coupleId, 'checkins', key), (s) => {
      setRatings(s.data()?.ratings ?? {})
      setNotes(s.data()?.notes ?? {})
    })
  }, [coupleId, key])

  const myRating = user ? ratings[user.uid] : undefined
  const partnerRating = partner ? ratings[partner.uid] : undefined
  const partnerNote = partner ? notes[partner.uid] : undefined
  const partnerName = partner?.name || 'your partner'

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!rating || !db || !coupleId || !user) return
    setBusy(true)
    try {
      await setDoc(
        doc(db, 'couples', coupleId, 'checkins', key),
        {
          ratings: { [user.uid]: rating },
          notes: { [user.uid]: note.trim() },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card checkin">
      <h3 className="card-h muted-h">Weekly check-in</h3>

      {!myRating ? (
        <form className="form" onSubmit={submit}>
          <p className="checkin-q">How did our week together feel?</p>
          <div className="checkin-faces">
            {FACES.map((f, i) => (
              <button
                key={i}
                type="button"
                className={`checkin-face ${rating === i + 1 ? 'sel' : ''}`}
                onClick={() => setRating(i + 1)}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            className="input"
            type="text"
            placeholder="Anything on your mind? (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button className="btn" type="submit" disabled={busy || !rating}>
            {busy ? 'Sending…' : 'Submit check-in'}
          </button>
        </form>
      ) : (
        <div className="checkin-results">
          <div className="checkin-result">
            <span className="entry-who">You</span>
            <span className="checkin-face-lg">{FACES[myRating - 1]}</span>
            {notes[user!.uid] && <span className="checkin-note">{notes[user!.uid]}</span>}
          </div>
          {partnerRating ? (
            <div className="checkin-result">
              <span className="entry-who">{partnerName}</span>
              <span className="checkin-face-lg">{FACES[partnerRating - 1]}</span>
              {partnerNote && <span className="checkin-note">{partnerNote}</span>}
            </div>
          ) : (
            <p className="entry-empty">Waiting for {partnerName} to check in…</p>
          )}
        </div>
      )}
    </div>
  )
}
