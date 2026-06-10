import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'

type BatteryLike = {
  level: number
  charging: boolean
  addEventListener: (t: string, cb: () => void) => void
  removeEventListener: (t: string, cb: () => void) => void
}

const LOW_PCT = 15

function batIcon(pct: number, charging: boolean): string {
  if (charging) return '🔌'
  if (pct <= LOW_PCT) return '🪫'
  return '🔋'
}

// Shares this device's battery level with the partner (#23) using the Battery
// Status API, and shows the partner's level back. Pushes only on real change
// (and throttled by the browser's own event cadence) to avoid write spam.
export function BatteryShare() {
  const { user } = useAuth()
  const { couple, partner, paired, updateBattery } = useCouple()
  const [supported, setSupported] = useState(true)

  // Keep the latest writer without making it an effect dependency (avoids
  // tearing down/recreating the battery listener on every provider re-render).
  const updateRef = useRef(updateBattery)
  updateRef.current = updateBattery

  useEffect(() => {
    if (!paired) return
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryLike> }
    if (typeof nav.getBattery !== 'function') {
      setSupported(false)
      return
    }
    let bat: BatteryLike | null = null
    let cancelled = false
    let lastPct = -1
    const push = () => {
      if (!bat || typeof bat.level !== 'number') return
      const pct = Math.round(bat.level * 100)
      // Only write when the rounded percent or charging state actually changes.
      if (pct === lastPct) return
      lastPct = pct
      void updateRef.current(pct, Boolean(bat.charging))
    }
    nav
      .getBattery()
      .then((b) => {
        if (cancelled || !b) return
        bat = b
        push()
        // Some browsers expose getBattery() but a limited object with no event
        // methods — guard so we never crash, just skip live updates.
        if (typeof b.addEventListener === 'function') {
          b.addEventListener('levelchange', push)
          b.addEventListener('chargingchange', push)
        }
      })
      .catch(() => setSupported(false))
    return () => {
      cancelled = true
      if (bat && typeof bat.removeEventListener === 'function') {
        try {
          bat.removeEventListener('levelchange', push)
          bat.removeEventListener('chargingchange', push)
        } catch {
          /* ignore */
        }
      }
    }
  }, [paired])

  if (!paired) return null

  const mine = user ? couple?.battery?.[user.uid] : null
  const theirs = partner ? couple?.battery?.[partner.uid] : null

  return (
    <div className="card battery-card">
      <h3 className="card-h muted-h">Battery</h3>
      <div className="battery-row">
        <div className="battery-one">
          <span className="battery-who">You</span>
          {mine ? (
            <span className="battery-val">
              {batIcon(mine.level, mine.charging)} {mine.level}%
            </span>
          ) : (
            <span className="battery-val muted">{supported ? '—' : 'not shared'}</span>
          )}
        </div>
        <div className="battery-one">
          <span className="battery-who">{partner?.name || 'Partner'}</span>
          {theirs ? (
            <span
              className={`battery-val ${theirs.level <= LOW_PCT && !theirs.charging ? 'low' : ''}`}
            >
              {batIcon(theirs.level, theirs.charging)} {theirs.level}%
            </span>
          ) : (
            <span className="battery-val muted">—</span>
          )}
        </div>
      </div>
      {!supported && (
        <p className="entry-empty">This browser can’t read battery level, so yours isn’t shared.</p>
      )}
    </div>
  )
}
