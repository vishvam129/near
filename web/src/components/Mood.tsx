import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'
import { EmojiPicker } from './EmojiPicker'

const QUICK = ['😄', '🙂', '😐', '😔', '😴', '😍', '🥺', '😤']

export function Mood() {
  const { user } = useAuth()
  const { couple, partner, setMood } = useCouple()
  const [picking, setPicking] = useState(false)
  const mine = user ? couple?.moods?.[user.uid] : undefined
  const theirs = partner ? couple?.moods?.[partner.uid] : undefined
  const partnerName = partner?.name || partner?.email || 'Your partner'

  return (
    <div className="card mood">
      <h3 className="card-h muted-h">How are you feeling?</h3>
      <div className="mood-row">
        {QUICK.map((m) => (
          <button
            key={m}
            type="button"
            className={`mood-opt ${mine === m ? 'sel' : ''}`}
            onClick={() => void setMood(mine === m ? '' : m)}
          >
            {m}
          </button>
        ))}
        <button
          type="button"
          className="mood-opt mood-more"
          aria-label="More emojis"
          onClick={() => setPicking(true)}
        >
          ＋
        </button>
      </div>

      {mine && !QUICK.includes(mine) && (
        <div className="mood-current">
          Your mood: <span className="mood-partner-emoji">{mine}</span>{' '}
          <button type="button" className="link" onClick={() => void setMood('')}>
            clear
          </button>
        </div>
      )}

      {theirs && (
        <div className="mood-partner">
          {partnerName} feels <span className="mood-partner-emoji">{theirs}</span>
        </div>
      )}

      {picking && (
        <EmojiPicker
          onPick={(e) => {
            void setMood(e)
            setPicking(false)
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  )
}
