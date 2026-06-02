import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'
import { timeAgo } from '../lib/format'

export function Greeting() {
  const { user } = useAuth()
  const { couple, partner, sendGreeting } = useCouple()
  const [sent, setSent] = useState<string | null>(null)

  const g = couple?.greeting
  const fromPartner = g && g.from !== user?.uid
  const partnerName = partner?.name || partner?.email || 'Your partner'

  async function send(type: string) {
    await sendGreeting(type)
    setSent(type)
    window.setTimeout(() => setSent(null), 1800)
  }

  return (
    <div className="card greeting">
      <h3 className="card-h muted-h">Say hello</h3>
      <div className="greeting-row">
        <button
          type="button"
          className="greeting-btn"
          onClick={() => void send('morning')}
          disabled={sent === 'morning'}
        >
          {sent === 'morning' ? 'Sent ☀️' : '☀️ Good morning'}
        </button>
        <button
          type="button"
          className="greeting-btn"
          onClick={() => void send('night')}
          disabled={sent === 'night'}
        >
          {sent === 'night' ? 'Sent 🌙' : '🌙 Good night'}
        </button>
      </div>
      {fromPartner && g?.at && (
        <div className="greeting-from">
          {partnerName} said {g.type === 'night' ? 'good night 🌙' : 'good morning ☀️'} ·{' '}
          {timeAgo(g.at)}
        </div>
      )}
    </div>
  )
}
