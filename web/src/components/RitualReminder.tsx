import { useEffect, useRef, useState } from 'react'
import { useCouple } from '../couple/CoupleProvider'
import { shouldNudge, ackRitual } from '../lib/ritual'

// Watches for the couple's daily-ritual time and shows a gentle in-app nudge
// (plus a local notification if the user has granted permission). Mounted once
// in the Shell so it can appear on any tab.
export function RitualReminder() {
  const { paired, partner } = useCouple()
  const [show, setShow] = useState(false)
  const notified = useRef(false)

  useEffect(() => {
    if (!paired) return
    const check = () => setShow(shouldNudge())
    check()
    const id = window.setInterval(check, 60_000)
    return () => window.clearInterval(id)
  }, [paired])

  // Fire a local notification once when the ritual first becomes due today.
  useEffect(() => {
    if (!show || notified.current) return
    notified.current = true
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('💞 Your daily moment', {
          body: `Take a minute with ${partner?.name || 'your person'} — answer today's question.`,
          icon: '/icon-192.png',
        })
      } catch {
        /* best-effort */
      }
    }
  }, [show, partner?.name])

  if (!paired || !show) return null

  return (
    <div className="ritual-nudge" role="status">
      <span className="ritual-nudge-text">
        💞 Your daily moment — take a minute with {partner?.name || 'your person'}
      </span>
      <button
        type="button"
        className="ritual-nudge-btn"
        onClick={() => {
          ackRitual()
          setShow(false)
        }}
      >
        Done
      </button>
    </div>
  )
}
