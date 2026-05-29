import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple, type Profile } from '../couple/CoupleProvider'
import { Avatar } from '../components/Avatar'
import { timeInZone } from '../lib/format'
import EditProfile from './EditProfile'

function PersonCard({ p, label }: { p: Profile; label: string }) {
  const [now, setNow] = useState(() => timeInZone(p.timezone))
  useEffect(() => {
    setNow(timeInZone(p.timezone))
    const id = setInterval(() => setNow(timeInZone(p.timezone)), 20_000)
    return () => clearInterval(id)
  }, [p.timezone])

  return (
    <div className="person">
      <Avatar name={p.name} email={p.email} photoURL={p.photoURL} size={48} />
      <div className="person-info">
        <div className="person-role">{label}</div>
        <div className="person-name">{p.name || p.email || '—'}</div>
        <div className="person-meta">
          {p.city || 'No city set'} · {now}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { logout } = useAuth()
  const { profile, partner } = useCouple()
  const [editing, setEditing] = useState(false)

  if (editing) return <EditProfile onDone={() => setEditing(false)} />

  return (
    <div className="auth-wrap">
      <div className="card">
        <div className="brand">
          <span className="dot" /> Near
        </div>
        <div className="paired-badge">💞 You’re connected</div>

        <div className="people">
          {profile && <PersonCard p={profile} label="You" />}
          {partner ? (
            <PersonCard p={partner} label="Your partner" />
          ) : (
            <div className="person person-empty">Waiting for your partner’s profile…</div>
          )}
        </div>

        <p className="tagline">
          Profiles &amp; timezones are set. The full dashboard — clocks, countdown, chat,
          and shared moments — comes next.
        </p>

        <button className="btn" type="button" onClick={() => setEditing(true)}>
          Edit your profile
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => void logout()}>
          Sign out
        </button>
      </div>
    </div>
  )
}
