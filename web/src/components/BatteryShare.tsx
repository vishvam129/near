import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'

type BatteryLike = {
  level: number
  charging: boolean
  addEventListener: (t: string, cb: () => void) => void
  removeEventListener: (t: string, cb: () => void) => void
}

function batIcon(level: number, charging: boolean): string {
  if (charging) return '🔌'
  if (level <= 0.15) return '🪫'
  return '🔋'
}

// Shares this device's battery level with the partner (#23) using the Battery
// Status API, and shows the partner's level back. Pushes only on real change
// (and throttled by the browser's own event cadence) to avoid write spam.
export function BatteryShare() {
  const { user } = useAuth()
  const { couple, partner, paired, updateBattery } = useCouple()
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (!paired) return
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryLike> }
    if (!nav.getBattery) {
      setSupported(false)
      return
    }
    let bat: BatteryLike | null = null
    let cancelled = false
    let lastPct = -1
    const push = () => {
      if (!bat) return
      const pct = Math.round(bat.level * 100)
      // Only write when the rounded percent or charging state actually changes.
      if (pct === lastPct) return
      lastPct = pct
      void updateBattery(pct, bat.charging)
    }
    nav.getBattery().then((b) => {
      if (cancelled) return
      bat = b
      push()
      b.addEventListener('levelchange', push)
      b.addEventListener('chargingchange', push)
    })
    return () => {
      cancelled = true
      if (bat) {
        bat.removeEventListener('levelchange', push)
        bat.removeEventListener('chargingchange', push)
      }
    }
  }, [paired, updateBattery])

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
              {batIcon(mine.level / 100, mine.charging)} {mine.level}%
            </span>
          ) : (
            <span className="battery-val muted">{supported ? '—' : 'not shared'}</span>
          )}
        </div>
        <div className="battery-one">
          <span className="battery-who">{partner?.name || 'Partner'}</span>
          {theirs ? (
            <span className={`battery-val ${theirs.level <= 15 && !theirs.charging ? 'low' : ''}`}>
              {batIcon(theirs.level / 100, theirs.charging)} {theirs.level}%
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
