import { useState } from 'react'
import { TRUTHS, DARES } from '../../lib/games'

const KEY = 'near_spicy_pin'
function hash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return String(h)
}
const hasSpicy = () => Boolean(localStorage.getItem(KEY))
const setSpicy = (p: string) => localStorage.setItem(KEY, hash(p))
const verifySpicy = (p: string) => localStorage.getItem(KEY) === hash(p)

export function SpicyZone() {
  const [unlocked, setUnlocked] = useState(false)
  const [setup, setSetup] = useState(() => !hasSpicy())
  const [pin, setPin] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [prompt, setPrompt] = useState<{ kind: string; text: string } | null>(null)

  function doSetup() {
    if (pin.length < 4) {
      setErr('Use at least 4 digits.')
      return
    }
    setSpicy(pin)
    setSetup(false)
    setUnlocked(true)
    setPin('')
    setErr(null)
  }
  function doUnlock() {
    if (verifySpicy(pin)) {
      setUnlocked(true)
      setPin('')
      setErr(null)
    } else {
      setErr('Wrong PIN.')
      setPin('')
    }
  }
  function pick(kind: 'Truth' | 'Dare') {
    const arr = kind === 'Truth' ? TRUTHS.spicy : DARES.spicy
    setPrompt({ kind, text: arr[Math.floor(Math.random() * arr.length)] })
  }

  if (!unlocked) {
    return (
      <div className="card game-card">
        <h3 className="card-h muted-h">Spicy 🌶️ (private)</h3>
        <p className="entry-empty">
          {setup ? 'Set a PIN to lock this section (this device).' : 'Enter your PIN to open.'}
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
    <div className="card game-card">
      <h3 className="card-h muted-h">Spicy 🌶️</h3>
      {prompt && (
        <div className="td-prompt">
          <span className="td-kind">{prompt.kind}</span>
          {prompt.text}
        </div>
      )}
      <div className="row-actions">
        <button type="button" className="btn" onClick={() => pick('Truth')}>
          Spicy truth
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => pick('Dare')}>
          Spicy dare
        </button>
      </div>
      <button type="button" className="link" onClick={() => setUnlocked(false)}>
        Lock 🔒
      </button>
    </div>
  )
}
