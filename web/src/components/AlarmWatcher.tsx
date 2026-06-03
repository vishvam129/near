import { useEffect, useRef, useState } from 'react'
import { useCouple } from '../couple/CoupleProvider'

// Shows a full-screen alarm when the shared alarm time passes (while the app is
// open). Dismiss clears it for both partners.
export function AlarmWatcher() {
  const { couple, setAlarm } = useCouple()
  const [, tick] = useState(0)
  const dismissed = useRef<number | null>(null)

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const alarm = couple?.alarm ?? null
  const firing = Boolean(alarm && alarm.at <= Date.now() && dismissed.current !== alarm.at)
  if (!firing || !alarm) return null

  return (
    <div className="alarm-overlay">
      <div className="alarm-card">
        <div className="alarm-emoji">⏰</div>
        <div className="alarm-label">{alarm.label}</div>
        <button
          type="button"
          className="btn"
          onClick={() => {
            dismissed.current = alarm.at
            void setAlarm(null)
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
