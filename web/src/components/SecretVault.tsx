import { useState } from 'react'
import { useCouple } from '../couple/CoupleProvider'
import { AlbumGrid } from './AlbumGrid'

const KEY = 'near_vault_pin'
function hash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return String(h)
}
const hasPin = () => Boolean(localStorage.getItem(KEY))
const setPinHash = (p: string) => localStorage.setItem(KEY, hash(p))
const verify = (p: string) => localStorage.getItem(KEY) === hash(p)

// A private photo album behind a device-local PIN (#18). The PIN guards access
// on this device only — it's a soft lock, like the spicy zone, not encryption.
export function SecretVault() {
  const { paired } = useCouple()
  const [unlocked, setUnlocked] = useState(false)
  const [setup, setSetup] = useState(() => !hasPin())
  const [pin, setPin] = useState('')
  const [err, setErr] = useState<string | null>(null)

  if (!paired) return null

  function doSetup() {
    if (pin.length < 4) {
      setErr('Use at least 4 digits.')
      return
    }
    setPinHash(pin)
    setSetup(false)
    setUnlocked(true)
    setPin('')
    setErr(null)
  }
  function doUnlock() {
    if (verify(pin)) {
      setUnlocked(true)
      setPin('')
      setErr(null)
    } else {
      setErr('Wrong PIN.')
      setPin('')
    }
  }

  if (!unlocked) {
    return (
      <div className="card">
        <h3 className="card-h muted-h">Secret vault 🔒</h3>
        <p className="entry-empty">
          {setup ? 'Set a PIN to lock this private album (this device).' : 'Enter your PIN to open.'}
        </p>
        <div className="pin-set">
          <input
            className="input"
            type="password"
            inputMode="numeric"
            placeholder={setup ? 'Set a PIN (4+ digits)' : 'PIN'}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value)
              setErr(null)
            }}
          />
          <button
            type="button"
            className="btn pin-set-btn"
            onClick={setup ? doSetup : doUnlock}
            disabled={!pin}
          >
            {setup ? 'Set' : 'Unlock'}
          </button>
        </div>
        {err && <div className="err">{err}</div>}
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="card-h muted-h">Secret vault 🔓</h3>
      <AlbumGrid name="vault" emptyText="Private album — only you two, behind the PIN." />
      <button type="button" className="link" onClick={() => setUnlocked(false)}>
        Lock 🔒
      </button>
    </div>
  )
}
