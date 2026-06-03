import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'

// Great-circle distance between two lat/lng points (haversine), in miles.
function milesApart(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(s)))
}

// Equirectangular projection into 0..100 % of the map box.
function project(lat: number, lng: number): { x: number; y: number } {
  return { x: ((lng + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 }
}

export function DistanceMap() {
  const { user } = useAuth()
  const { couple, partner, profile, paired, setGeo } = useCouple()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (!paired) return null

  const mine = user ? couple?.geo?.[user.uid] : undefined
  const theirs = partner ? couple?.geo?.[partner.uid] : undefined

  function share() {
    if (!navigator.geolocation) {
      setErr('This browser can’t share location.')
      return
    }
    setBusy(true)
    setErr(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void setGeo(pos.coords.latitude, pos.coords.longitude).finally(() => setBusy(false))
      },
      (e) => {
        const msg =
          e.code === e.PERMISSION_DENIED
            ? 'Location permission was denied.'
            : e.code === e.TIMEOUT
              ? 'Timed out getting your location — try again.'
              : 'Couldn’t determine your location right now.'
        setErr(msg)
        setBusy(false)
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
    )
  }

  const both = mine && theirs
  const miles = both ? milesApart(mine, theirs) : null
  const pins = [
    mine ? { ...project(mine.lat, mine.lng), label: profile?.name || 'You', me: true } : null,
    theirs
      ? { ...project(theirs.lat, theirs.lng), label: partner?.name || 'Partner', me: false }
      : null,
  ].filter(Boolean) as { x: number; y: number; label: string; me: boolean }[]

  return (
    <div className="card map-card">
      <h3 className="card-h muted-h">Distance between us</h3>

      {miles !== null ? (
        <div className="map-miles">🛰️ {miles.toLocaleString()} miles apart</div>
      ) : (
        <p className="entry-empty">Share your location to see how far apart you are.</p>
      )}

      <div className="map-box">
        {pins.length === 2 && (
          <svg className="map-line" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line
              x1={pins[0].x}
              y1={pins[0].y}
              x2={pins[1].x}
              y2={pins[1].y}
              stroke="var(--pink)"
              strokeWidth="0.6"
              strokeDasharray="2 1.5"
            />
          </svg>
        )}
        {pins.map((p) => (
          <div
            key={p.label + p.me}
            className={`map-pin ${p.me ? 'me' : ''}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <span className="map-pin-dot" />
            <span className="map-pin-label">{p.label}</span>
          </div>
        ))}
      </div>

      <button type="button" className="btn" onClick={share} disabled={busy}>
        {busy ? 'Locating…' : mine ? 'Update my location' : 'Share my location'}
      </button>
      {err && <div className="err">{err}</div>}
    </div>
  )
}
