import { useEffect, useState, type FormEvent } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useCouple } from '../couple/CoupleProvider'
import { useAuth } from '../auth/AuthProvider'
import { questionForDate } from '../lib/questions'

// UTC day key so both partners (any timezone) always share the same question/doc.
function utcDayKey(): string {
  const d = new Date()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${d.getUTCFullYear()}-${m}-${day}`
}

export function DailyQuestion() {
  const { couple, partner } = useCouple()
  const { user } = useAuth()
  const todayKey = utcDayKey()
  const question = questionForDate(todayKey)

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const coupleId = couple?.id
  useEffect(() => {
    if (!db || !coupleId) return
    return onSnapshot(doc(db, 'couples', coupleId, 'daily', todayKey), (s) => {
      setAnswers(s.data()?.answers ?? {})
    })
  }, [coupleId, todayKey])

  const myAnswer = user ? answers[user.uid] : undefined
  const partnerAnswer = partner ? answers[partner.uid] : undefined
  const partnerName = partner?.name || partner?.email || 'your partner'

  async function submit(e: FormEvent) {
    e.preventDefault()
    const t = draft.trim()
    if (!t || !db || !coupleId || !user) return
    setBusy(true)
    try {
      await setDoc(
        doc(db, 'couples', coupleId, 'daily', todayKey),
        { question, answers: { [user.uid]: t }, updatedAt: serverTimestamp() },
        { merge: true },
      )
      setDraft('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card daily">
      <h3 className="card-h muted-h">Today’s question</h3>
      <div className="daily-q">{question}</div>

      {!myAnswer ? (
        <form onSubmit={submit} className="form">
          <input
            className="input"
            type="text"
            placeholder="Your answer…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="btn" type="submit" disabled={busy || !draft.trim()}>
            {busy ? 'Sending…' : 'Answer'}
          </button>
        </form>
      ) : (
        <div className="daily-answers">
          <div className="daily-ans">
            <span className="daily-who">You</span>
            <span>{myAnswer}</span>
          </div>
          {partnerAnswer ? (
            <div className="daily-ans them">
              <span className="daily-who">{partnerName}</span>
              <span>{partnerAnswer}</span>
            </div>
          ) : (
            <div className="daily-wait">Waiting for {partnerName} to answer… 💭</div>
          )}
        </div>
      )}
    </div>
  )
}
