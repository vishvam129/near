import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'

type Active = { type: string; color: string | null }

// Watches the couple's `signal` field and plays a full-screen animation when
// the partner sends a friendship-lamp glow (#65), a kiss (#68) or a
// heartbeat (#67) while this app is open. One field, one overlay, three looks.
export function SignalOverlay() {
  const { user } = useAuth()
  const { couple, partner } = useCouple()
  const last = useRef<number | null>(null)
  const [active, setActive] = useState<Active | null>(null)

  useEffect(() => {
    if (!couple) return
    const t = couple.signal?.at?.getTime() ?? 0
    // Baseline on first load so the couple's very first signal still fires.
    if (last.current === null) {
      last.current = t
      return
    }
    if (t > last.current) {
      last.current = t
      const sig = couple.signal
      if (sig?.from && sig.from !== user?.uid) {
        setActive({ type: sig.type, color: sig.color })
        const ms = sig.type === 'lamp' ? 4000 : 2600
        const id = window.setTimeout(() => setActive(null), ms)
        return () => window.clearTimeout(id)
      }
    }
  }, [couple, user?.uid])

  if (!active) return null
  const who = partner?.name || partner?.email || 'Your partner'

  if (active.type === 'lamp') {
    return (
      <div
        className="signal-lamp"
        aria-live="polite"
        style={{ ['--lamp' as string]: active.color || '#ff5d8f' }}
      >
        <div className="signal-toast">💡 {who} is thinking of you</div>
      </div>
    )
  }

  if (active.type === 'heartbeat') {
    return (
      <div className="signal-overlay" aria-live="polite">
        <div className="signal-beat">💓</div>
        <div className="signal-toast">{who}’s heartbeat</div>
      </div>
    )
  }

  // kiss
  return (
    <div className="signal-overlay" aria-live="polite">
      <div className="signal-kiss">💋</div>
      <div className="signal-toast">{who} sent a kiss</div>
    </div>
  )
}
