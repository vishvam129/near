import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../auth/AuthProvider'
import { useCouple } from '../../couple/CoupleProvider'
import { COMPAT } from '../../lib/games'

export function CompatQuiz() {
  const { user } = useAuth()
  const { couple, partner } = useCouple()
  const [mine, setMine] = useState<Record<string, 'a' | 'b'>>({})
  const [theirs, setTheirs] = useState<Record<string, 'a' | 'b'>>({})
  const coupleId = couple?.id

  useEffect(() => {
    if (!db || !coupleId || !user) return
    return onSnapshot(doc(db, 'couples', coupleId, 'compat', user.uid), (s) =>
      setMine(s.data()?.answers ?? {}),
    )
  }, [coupleId, user?.uid])

  useEffect(() => {
    if (!db || !coupleId || !partner) return
    return onSnapshot(doc(db, 'couples', coupleId, 'compat', partner.uid), (s) =>
      setTheirs(s.data()?.answers ?? {}),
    )
  }, [coupleId, partner?.uid])

  async function pick(idx: number, choice: 'a' | 'b') {
    if (!db || !coupleId || !user) return
    await setDoc(
      doc(db, 'couples', coupleId, 'compat', user.uid),
      { answers: { [idx]: choice }, updatedAt: serverTimestamp() },
      { merge: true },
    )
  }

  const bothAnswered = COMPAT.map((_, i) => i).filter((i) => mine[i] && theirs[i])
  const matches = bothAnswered.filter((i) => mine[i] === theirs[i]).length
  const pct = bothAnswered.length ? Math.round((matches / bothAnswered.length) * 100) : null

  return (
    <div className="card game-card">
      <h3 className="card-h muted-h">Compatibility quiz</h3>
      {pct !== null ? (
        <div className="compat-score">
          {pct}% match · {matches}/{bothAnswered.length}
        </div>
      ) : (
        <p className="entry-empty">Pick your preferences — your match % shows once you both answer.</p>
      )}
      <div className="compat-list">
        {COMPAT.map((q, i) => {
          const my = mine[i]
          const their = theirs[i]
          const matched = Boolean(my && their && my === their)
          return (
            <div key={i} className="compat-q">
              {(['a', 'b'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`compat-opt ${my === opt ? 'sel' : ''}`}
                  onClick={() => void pick(i, opt)}
                >
                  {q[opt]}
                </button>
              ))}
              {my && their && (
                <span className={`compat-mark ${matched ? 'yes' : 'no'}`}>
                  {matched ? '💞' : '≠'}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
