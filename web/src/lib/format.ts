export function initials(name: string | null, email: string | null): string {
  const base = (name || email || '?').trim()
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return base.slice(0, 2).toUpperCase()
}

/** Current time (HH:MM) in the given IANA timezone, e.g. "America/New_York". */
export function timeInZone(tz: string, date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat([], {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: tz,
    }).format(date)
  } catch {
    return '--:--'
  }
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** "Today" / "Yesterday" / "12 Jun" (with year if not the current year). */
export function dayLabel(d: Date): string {
  const now = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return new Intl.DateTimeFormat([], {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  }).format(d)
}

/** Format a 'YYYY-MM-DD' string as e.g. "10 Jul 2026". */
export function prettyDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  return new Intl.DateTimeFormat([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/** A Date as a 'YYYY-MM-DD' string suitable for <input type="date">. */
export function toDateInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Countdown from now to the start of `dateStr` ('YYYY-MM-DD'), in local time. */
export function countdownTo(dateStr: string): {
  days: number
  hours: number
  minutes: number
  past: boolean
} {
  const target = new Date(dateStr + 'T00:00:00')
  if (isNaN(target.getTime())) return { days: 0, hours: 0, minutes: 0, past: false }
  const ms = target.getTime() - Date.now()
  const past = ms <= 0
  const abs = Math.abs(ms)
  return {
    days: Math.floor(abs / 86_400_000),
    hours: Math.floor((abs % 86_400_000) / 3_600_000),
    minutes: Math.floor((abs % 3_600_000) / 60_000),
    past,
  }
}

/**
 * Calendar duration (years/months/days) from `dateStr` until today.
 * Steps a cursor forward by whole years, then whole months, then counts the
 * remaining days — so the result is always non-negative (no end-of-month
 * borrow bugs like "1 month, -1 days").
 */
export function durationSince(
  dateStr: string,
): { years: number; months: number; days: number } | null {
  const start = new Date(dateStr + 'T00:00:00')
  if (isNaN(start.getTime())) return null
  const now = new Date()
  if (start.getTime() >= now.getTime()) return { years: 0, months: 0, days: 0 }

  const cursor = new Date(start)

  let years = 0
  for (;;) {
    const next = new Date(cursor)
    next.setFullYear(cursor.getFullYear() + 1)
    if (next.getTime() <= now.getTime()) {
      cursor.setTime(next.getTime())
      years++
    } else break
  }

  let months = 0
  for (;;) {
    const next = new Date(cursor)
    next.setMonth(cursor.getMonth() + 1)
    if (next.getTime() <= now.getTime()) {
      cursor.setTime(next.getTime())
      months++
    } else break
  }

  const days = Math.floor((now.getTime() - cursor.getTime()) / 86_400_000)
  return { years, months, days }
}

/** Human string like "1 year, 3 months, 12 days" (skips leading zero units). */
export function formatDuration(d: { years: number; months: number; days: number }): string {
  const unit = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`
  const parts: string[] = []
  if (d.years) parts.push(unit(d.years, 'year'))
  if (d.months) parts.push(unit(d.months, 'month'))
  parts.push(unit(d.days, 'day'))
  return parts.join(', ')
}

/** Friendly, country-labelled shortlist for the top of the timezone picker. */
export function commonTimezones(): { value: string; label: string }[] {
  return [
    { value: 'Asia/Kolkata', label: 'India — IST (all states)' },
    { value: 'Asia/Dubai', label: 'UAE — Dubai' },
    { value: 'Asia/Karachi', label: 'Pakistan — Karachi' },
    { value: 'Asia/Dhaka', label: 'Bangladesh — Dhaka' },
    { value: 'Europe/London', label: 'UK — London' },
    { value: 'Europe/Paris', label: 'Central Europe — Paris' },
    { value: 'Europe/Berlin', label: 'Germany — Berlin' },
    { value: 'America/New_York', label: 'US Eastern — New York' },
    { value: 'America/Chicago', label: 'US Central — Chicago' },
    { value: 'America/Denver', label: 'US Mountain — Denver' },
    { value: 'America/Los_Angeles', label: 'US Pacific — Los Angeles' },
    { value: 'America/Toronto', label: 'Canada — Toronto' },
    { value: 'America/Sao_Paulo', label: 'Brazil — São Paulo' },
    { value: 'Asia/Singapore', label: 'Singapore' },
    { value: 'Asia/Tokyo', label: 'Japan — Tokyo' },
    { value: 'Australia/Sydney', label: 'Australia — Sydney' },
    { value: 'Africa/Johannesburg', label: 'South Africa — Johannesburg' },
    { value: 'Pacific/Auckland', label: 'New Zealand — Auckland' },
    { value: 'UTC', label: 'UTC' },
  ]
}

/** List of IANA timezones for a picker. Uses the browser list when available. */
export function timezoneList(): string[] {
  const sv = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] })
    .supportedValuesOf
  if (typeof sv === 'function') {
    try {
      return sv('timeZone')
    } catch {
      /* fall through to the static list */
    }
  }
  return [
    'UTC',
    'America/Los_Angeles',
    'America/Denver',
    'America/Chicago',
    'America/New_York',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Africa/Johannesburg',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
  ]
}
