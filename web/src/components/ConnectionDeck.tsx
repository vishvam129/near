import { useState } from 'react'
import { useCouple } from '../couple/CoupleProvider'

const COLORS = ['#ff5d8f', '#ff8a3d', '#ffd23f', '#4ad991', '#3db6ff', '#a86bff']

// Send-side for the live affection signals: friendship lamp (#65, pick a
// colour and glow your partner's screen), virtual kiss (#68) and heartbeat
// (#67). The receive-side animations live in SignalOverlay.
export function ConnectionDeck() {
  const { paired, sendSignal } = useCouple()
  const [color, setColor] = useState(COLORS[0])
  const [sent, setSent] = useState<string | null>(null)

  if (!paired) return null

  async function send(type: 'lamp' | 'kiss' | 'heartbeat', label: string) {
    try {
      await sendSignal(type, type === 'lamp' ? color : undefined)
      setSent(label)
      window.setTimeout(() => setSent(null), 1600)
    } catch {
      /* not connected yet */
    }
  }

  return (
    <div className="card connect-deck">
      <h3 className="card-h muted-h">Send a little something</h3>

      <div className="lamp-row">
        <div className="lamp-colors">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`lamp-dot ${color === c ? 'sel' : ''}`}
              style={{ background: c }}
              aria-label={`Colour ${c}`}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <button
          type="button"
          className="btn lamp-glow"
          style={{ background: color }}
          onClick={() => void send('lamp', 'Lamp glowed 💡')}
        >
          💡 Glow
        </button>
      </div>

      <div className="row-actions connect-actions">
        <button type="button" className="btn btn-ghost" onClick={() => void send('kiss', 'Kiss sent 💋')}>
          💋 Kiss
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => void send('heartbeat', 'Heartbeat sent 💓')}
        >
          💓 Heartbeat
        </button>
      </div>

      {sent && <div className="connect-sent">{sent}</div>}
    </div>
  )
}
