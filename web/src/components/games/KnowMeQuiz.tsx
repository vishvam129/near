import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../auth/AuthProvider'
import { useCouple } from '../../couple/CoupleProvider'
import { KNOWME_PROMPTS } from '../../lib/games'

export function KnowMeQuiz() {
  const { user } = useAuth()
  const { couple, partner } = useCouple()
  const [tab, setTab] = useState<'me' | 'guess'>('me')
  const [mine, setMine] = useState<Record<string, string>>({})
  const [theirs, setTheirs] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const coupleId = couple?.id

  useEffect(() => {
    if (!db || !coupleId || !user) return
    return onSnapshot(doc(db, 'couples', coupleId, 'knowme', user.uid), (s) =>
      setMine(s.data()?.answers ?? {}),
    )
  }, [coupleId, user?.uid])

  useEffect(() => {
    if (!db || !coupleId || !partner) return
    return onSnapshot(doc(db, 'couples', coupleId, 'knowme', partner.uid), (s) =>
      setTheirs(s.data()?.answers ?? {}),
    )
  }, [coupleId, partner?.uid])

  async function save() {
    if (!db || !coupleId || !user) return
    setBusy(true)
    try {
      await setDoc(
        doc(db, 'couples', coupleId, 'knowme', user.uid),
        { answers: mine, updatedAt: serverTimestamp() },
        { merge: true },
      )
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1500)
    } finally {
      setBusy(false)
    }
  }

  const partnerName = partner?.name || 'your partner'
  const answeredByPartner = KNOWME_PROMPTS.map((_, i) => i).filter((i) => theirs[i]?.trim())

  return (
    <div className="card game-card knowme">
      <h3 className="card-h muted-h">How well do you know me?</h3>

      <div className="knowme-tabs">
        <button
          type="button"
          className={`knowme-tab ${tab === 'me' ? 'active' : ''}`}
          onClick={() => setTab('me')}
        >
          About me
        </button>
        <button
          type="button"
          className={`knowme-tab ${tab === 'guess' ? 'active' : ''}`}
          onClick={() => setTab('guess')}
        >
          Guess {partnerName}
        </button>
      </div>

      {tab === 'me' ? (
        <>
          <div className="knowme-list">
            {KNOWME_PROMPTS.map((p, i) => (
              <label key={i} className="field">
                <span className="field-label">{p}</span>
                <input
                  className="input"
                  type="text"
                  value={mine[i] ?? ''}
                  onChange={(e) => setMine((m) => ({ ...m, [i]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          <button className="btn" type="button" onClick={() => void save()} disabled={busy}>
            {saved ? 'Saved ✓' : busy ? 'Saving…' : 'Save my answers'}
          </button>
        </>
      ) : answeredByPartner.length === 0 ? (
        <p className="entry-empty">{partnerName} hasn’t filled in their answers yet.</p>
      ) : (
        <div className="knowme-list">
          {answeredByPartner.map((i) => (
            <div key={i} className="knowme-guess">
              <div className="field-label">{KNOWME_PROMPTS[i]}</div>
              {revealed[i] ? (
                <div className="knowme-answer">{theirs[i]}</div>
              ) : (
                <button
                  type="button"
                  className="link"
                  onClick={() => setRevealed((r) => ({ ...r, [i]: true }))}
                >
                  Reveal answer
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
