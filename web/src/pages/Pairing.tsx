import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'

export default function Pairing() {
  const { logout } = useAuth()
  const { inviteCode, pairWithCode } = useCouple()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    if (!inviteCode) return
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard may be blocked; user can still read the code */
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await pairWithCode(code)
      // On success the profile snapshot updates coupleId and the app routes to Home.
    } catch (err) {
      setError((err as Error)?.message ?? 'Could not pair. Please try again.')
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
        <h1 className="welcome">Connect with your person 💞</h1>
        <p className="tagline">
          Share your code with your partner, or enter theirs. Once linked, everything in
          Near is just the two of you.
        </p>

        <div className="code-label">Your invite code</div>
        <button type="button" className="code-box" onClick={copyCode} title="Tap to copy">
          <span className="code">{inviteCode ?? '······'}</span>
          <span className="copy">{copied ? 'Copied ✓' : 'Tap to copy'}</span>
        </button>

        <div className="divider"><span>or enter theirs</span></div>

        <form onSubmit={submit} className="form">
          <input
            className="input code-input"
            type="text"
            placeholder="PARTNER CODE"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            autoCapitalize="characters"
            autoComplete="off"
          />
          {error && <div className="err">{error}</div>}
          <button className="btn" type="submit" disabled={busy || !code.trim()}>
            {busy ? 'Linking…' : 'Pair us up'}
          </button>
        </form>

        <p className="switch">
          <button type="button" className="link" onClick={() => void logout()}>
            Sign out
          </button>
        </p>
      </div>
    </div>
  )
}
