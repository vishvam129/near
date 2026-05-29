import { useMemo, useState, type FormEvent } from 'react'
import { useCouple } from '../couple/CoupleProvider'
import { timezoneList } from '../lib/format'
import { Avatar } from '../components/Avatar'

export default function EditProfile({ onDone }: { onDone: () => void }) {
  const { profile, updateProfile } = useCouple()
  const [name, setName] = useState(profile?.name ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'UTC')
  const [photoURL, setPhotoURL] = useState(profile?.photoURL ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const zones = useMemo(() => timezoneList(), [])

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await updateProfile({ name, city, timezone, photoURL })
      onDone()
    } catch (err) {
      setError((err as Error)?.message ?? 'Could not save. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card">
        <div className="brand">
          <span className="dot" /> Near
        </div>
        <h1 className="welcome">Your profile</h1>

        <div className="avatar-preview">
          <Avatar name={name} email={profile?.email} photoURL={photoURL} size={72} />
        </div>

        <form onSubmit={save} className="form">
          <label className="field">
            <span className="field-label">Name</span>
            <input
              className="input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field-label">City</span>
            <input
              className="input"
              type="text"
              placeholder="e.g. London"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field-label">Timezone</span>
            <select
              className="input"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {zones.includes(timezone) ? null : <option value={timezone}>{timezone}</option>}
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Photo URL (optional)</span>
            <input
              className="input"
              type="url"
              placeholder="https://…"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
            />
          </label>

          {error && <div className="err">{error}</div>}

          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save profile'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onDone} disabled={busy}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}
