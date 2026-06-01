import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useCouple } from '../couple/CoupleProvider'
import { timezoneList, commonTimezones } from '../lib/format'
import { INDIAN_STATES } from '../lib/india'
import { fileToAvatarDataUrl } from '../lib/image'
import { Avatar } from '../components/Avatar'

export default function EditProfile({ onDone }: { onDone: () => void }) {
  const { profile, updateProfile } = useCouple()
  const [name, setName] = useState(profile?.name ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'UTC')
  const [photoURL, setPhotoURL] = useState(profile?.photoURL ?? '')
  const [busy, setBusy] = useState(false)
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const zones = useMemo(() => timezoneList(), [])
  const common = useMemo(() => commonTimezones(), [])
  const inCommon = common.some((c) => c.value === timezone)
  const isIndia = timezone === 'Asia/Kolkata'

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    setPicking(true)
    setError(null)
    try {
      setPhotoURL(await fileToAvatarDataUrl(file))
    } catch (err) {
      setError((err as Error)?.message ?? 'Could not load that image.')
    } finally {
      setPicking(false)
    }
  }

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
            <span className="field-label">{isIndia ? 'State / City' : 'City'}</span>
            <input
              className="input"
              type="text"
              placeholder={isIndia ? 'e.g. Maharashtra or Mumbai' : 'e.g. London'}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              list={isIndia ? 'india-states' : undefined}
            />
            {isIndia && (
              <datalist id="india-states">
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            )}
          </label>

          <label className="field">
            <span className="field-label">Timezone</span>
            <select
              className="input"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {!inCommon && !zones.includes(timezone) && (
                <option value={timezone}>{timezone}</option>
              )}
              <optgroup label="Common">
                {common.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="All timezones">
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z.replace(/_/g, ' ')}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          <div className="field">
            <span className="field-label">Photo (optional)</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onPickFile}
            />
            <div className="photo-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => fileRef.current?.click()}
                disabled={picking || busy}
              >
                {picking ? 'Loading…' : photoURL ? 'Change photo' : 'Select photo'}
              </button>
              {photoURL && (
                <button
                  type="button"
                  className="link"
                  onClick={() => setPhotoURL('')}
                  disabled={busy}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

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
