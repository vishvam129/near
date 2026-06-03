import { useState, type FormEvent, type ReactNode } from 'react'
import { hasPin, verifyPin } from '../lib/pin'

export function PinGate({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(() => hasPin())
  const [pin, setPin] = useState('')
  const [err, setErr] = useState(false)

  if (!locked) return <>{children}</>

  function submit(e: FormEvent) {
    e.preventDefault()
    if (verifyPin(pin)) {
      setLocked(false)
    } else {
      setErr(true)
      setPin('')
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card">
        <div className="brand">
          <span className="dot" /> Near
        </div>
        <h1 className="welcome">🔒 Locked</h1>
        <p className="tagline">Enter your PIN to open Near.</p>
        <form className="form" onSubmit={submit}>
          <input
            className="input"
            type="password"
            inputMode="numeric"
            placeholder="PIN"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value)
              setErr(false)
            }}
            autoFocus
          />
          {err && <div className="err">Wrong PIN — try again.</div>}
          <button className="btn" type="submit" disabled={!pin}>
            Unlock
          </button>
        </form>
      </div>
    </div>
  )
}
