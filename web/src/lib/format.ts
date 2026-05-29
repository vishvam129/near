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
