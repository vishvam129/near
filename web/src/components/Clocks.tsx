import { useEffect, useState } from 'react'
import type { Profile } from '../couple/CoupleProvider'
import { Avatar } from './Avatar'

function clockParts(tz: string, date: Date): { time: string; day: string } {
  try {
    const time = new Intl.DateTimeFormat([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: tz,
    }).format(date)
    const day = new Intl.DateTimeFormat([], {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: tz,
    }).format(date)
    return { time, day }
  } catch {
    return { time: '--:--', day: '' }
  }
}

function ClockCol({ p, label, now }: { p: Profile; label: string; now: Date }) {
  const { time, day } = clockParts(p.timezone, now)
  return (
    <div className="clock-col">
      <Avatar name={p.name} email={p.email} photoURL={p.photoURL} size={40} />
      <div className="clock-role">{label}</div>
      <div className="clock-time">{time}</div>
      <div className="clock-sub">
        {p.city || '—'}
        {day ? ` · ${day}` : ''}
      </div>
    </div>
  )
}

export function Clocks({ you, partner }: { you: Profile; partner: Profile | null }) {
  // One ticking clock drives both columns.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="clocks">
      <ClockCol p={you} label="You" now={now} />
      <div className="clock-heart">💞</div>
      {partner ? (
        <ClockCol p={partner} label="Your partner" now={now} />
      ) : (
        <div className="clock-col">
          <div className="avatar-fallback" style={{ width: 40, height: 40, fontSize: 16 }}>
            ?
          </div>
          <div className="clock-role">Your partner</div>
          <div className="clock-time">--:--</div>
          <div className="clock-sub">waiting…</div>
        </div>
      )}
    </div>
  )
}
