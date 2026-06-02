import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'

const HEARTS = ['💗', '💖', '💕', '❤️', '💞']

// Watches the couple's `poke` field and plays a heart burst + toast when the
// partner sends a "thinking of you" tap while this app is open.
export function LoveBurst() {
  const { user } = useAuth()
  const { couple, partner } = useCouple()
  const lastPoke = useRef<number | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const p = couple?.poke
    if (!p?.at) return
    const t = p.at.getTime()
    // Ignore whatever poke already exists when we first mount.
    if (lastPoke.current === null) {
      lastPoke.current = t
      return
    }
    if (t > lastPoke.current) {
      lastPoke.current = t
      if (p.from && p.from !== user?.uid) {
        setActive(true)
        const id = window.setTimeout(() => setActive(false), 2600)
        return () => window.clearTimeout(id)
      }
    }
  }, [couple?.poke, user?.uid])

  if (!active) return null
  const who = partner?.name || partner?.email || 'Your partner'

  return (
    <div className="love-burst" aria-live="polite">
      <div className="love-toast">💗 {who} is thinking of you</div>
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="love-heart"
          style={{
            left: `${6 + (i * 88) / 14}%`,
            animationDelay: `${(i % 7) * 0.12}s`,
            fontSize: `${20 + ((i * 7) % 18)}px`,
          }}
        >
          {HEARTS[i % HEARTS.length]}
        </span>
      ))}
    </div>
  )
}
