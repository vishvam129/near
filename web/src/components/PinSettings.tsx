import { useState } from 'react'
import { hasPin, setPin, clearPin } from '../lib/pin'

export function PinSettings() {
  const [enabled, setEnabled] = useState(() => hasPin())
  const [val, setVal] = useState('')
  const [msg, setMsg] = useState('')

  function save() {
    if (val.length < 4) {
      setMsg('Use at least 4 digits.')
      return
    }
    setPin(val)
    setEnabled(true)
    setVal('')
    setMsg('App lock on ✓')
  }
  function off() {
    clearPin()
    setEnabled(false)
    setVal('')
    setMsg('App lock off')
  }

  return (
    <div className="pin-settings field">
      <span className="field-label">App lock (this device)</span>
      {enabled ? (
        <div className="pin-on">
          🔒 Lock is on
          <button type="button" className="link" onClick={off}>
            turn off
          </button>
        </div>
      ) : (
        <div className="pin-set">
          <input
            className="input"
            type="password"
            inputMode="numeric"
            placeholder="Set a PIN (4+ digits)"
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
          <button type="button" className="btn pin-set-btn" onClick={save}>
            Set
          </button>
        </div>
      )}
      {msg && <div className="pin-msg">{msg}</div>}
    </div>
  )
}
