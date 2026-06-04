import { useEffect, useState } from 'react'
import { useCouple } from '../couple/CoupleProvider'
import { prettyDate } from '../lib/format'

function parts(targetMs: number) {
  const ms = targetMs - Date.now()
  const past = ms <= 0
  const abs = Math.abs(ms)
  return {
    past,
    d: Math.floor(abs / 86_400_000),
    h: Math.floor((abs % 86_400_000) / 3_600_000),
    m: Math.floor((abs % 3_600_000) / 60_000),
    s: Math.floor((abs % 60_000) / 1000),
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

// A full-screen "lock-screen style" countdown to the next meetup (#9). Web
// can't draw a real OS home/lock-screen widget, so this is the in-app
// equivalent — a big immersive timer you can pop into.
export function ImmersiveCountdown() {
  const { couple, paired } = useCouple()
  const [open, setOpen] = useState(false)
  const [, setTick] = useState(0)

  const meetup = couple?.nextMeetup ?? null
  const targetMs = meetup ? new Date(meetup.date + 'T00:00:00').getTime() : NaN

  useEffect(() => {
    if (!open) return
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [open])

  if (!paired || !meetup || isNaN(targetMs)) return null

  const p = parts(targetMs)

  return (
    <>
      <button type="button" className="btn btn-ghost immersive-open" onClick={() => setOpen(true)}>
        🌌 Immersive countdown
      </button>

      {open && (
        <div className="immersive" onClick={() => setOpen(false)}>
          <div className="immersive-label">
            {p.past ? 'Since we were together' : 'Until we’re together'}
          </div>
          <div className="immersive-clock">
            <div className="immersive-unit">
              <b>{p.d}</b>
              <span>days</span>
            </div>
            <div className="immersive-unit">
              <b>{pad(p.h)}</b>
              <span>hrs</span>
            </div>
            <div className="immersive-unit">
              <b>{pad(p.m)}</b>
              <span>min</span>
            </div>
            <div className="immersive-unit">
              <b>{pad(p.s)}</b>
              <span>sec</span>
            </div>
          </div>
          <div className="immersive-meta">
            📍 {meetup.place || 'our next meetup'} · {prettyDate(meetup.date)}
          </div>
          <div className="immersive-hint">tap anywhere to close</div>
        </div>
      )}
    </>
  )
}
