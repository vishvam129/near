// Daily-ritual nudge (#improvement). The couple picks a local time for their
// daily check-in; when that time passes and they haven't acknowledged today's
// ritual, the app gently nudges them. No server needed — a free, local way to
// get the daily-habit retention benefit.
const TIME_KEY = 'near_ritual_time'
const ACK_KEY = 'near_ritual_ack'

export function getRitualTime(): string | null {
  try {
    return localStorage.getItem(TIME_KEY)
  } catch {
    return null
  }
}

export function setRitualTime(time: string): void {
  try {
    localStorage.setItem(TIME_KEY, time)
  } catch {
    /* ignore */
  }
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export function ritualAckedToday(): boolean {
  try {
    return localStorage.getItem(ACK_KEY) === todayKey()
  } catch {
    return false
  }
}

export function ackRitual(): void {
  try {
    localStorage.setItem(ACK_KEY, todayKey())
  } catch {
    /* ignore */
  }
}

// True when a ritual time is set, it's passed for today, and not yet acked.
export function shouldNudge(): boolean {
  const t = getRitualTime()
  if (!t || ritualAckedToday()) return false
  const [h, m] = t.split(':').map(Number)
  if (Number.isNaN(h)) return false
  const target = new Date()
  target.setHours(h, m, 0, 0)
  return new Date() >= target
}
