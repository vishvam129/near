import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'

export default function SignIn() {
  const { signIn, signUp, signInWithGoogle, ready } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'up') await signUp(email, password, name.trim())
      else await signIn(email, password)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  async function google() {
    setError(null)
    setBusy(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(friendlyError(err))
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
        <p className="tagline">Stay close, no matter the distance.</p>

        {!ready && (
          <div className="banner">
            ⚙️ Firebase isn’t connected yet. The form is live, but sign-in needs your keys
            in <code>web/.env</code> — see <code>web/.env.example</code>.
          </div>
        )}

        <form onSubmit={submit} className="form">
          {mode === 'up' && (
            <input
              className="input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          )}
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
            required
          />

          {error && <div className="err">{error}</div>}

          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'up' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="divider"><span>or</span></div>

        <button className="btn btn-google" type="button" onClick={google} disabled={busy}>
          <GoogleIcon /> Continue with Google
        </button>

        <p className="switch">
          {mode === 'in' ? "New here?" : 'Already have an account?'}{' '}
          <button
            type="button"
            className="link"
            onClick={() => {
              setMode(mode === 'in' ? 'up' : 'in')
              setError(null)
            }}
          >
            {mode === 'in' ? 'Create an account' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.5 29.3 4.6 24 4.6 13.3 4.6 4.6 13.3 4.6 24S13.3 43.4 24 43.4 43.4 34.7 43.4 24c0-1.2-.1-2.3-.3-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.5 29.3 4.6 24 4.6 16.3 4.6 9.7 9 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.4c5.2 0 9.9-1.8 13.4-4.9l-6.2-5.2C29.2 34.9 26.7 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.6 38.9 16.2 43.4 24 43.4z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.2 5.2c-.4.4 6.6-4.8 6.6-14.6 0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  )
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  const map: Record<string, string> = {
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/missing-password': 'Please enter a password.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/email-already-in-use': 'That email is already registered — try signing in.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/too-many-requests': 'Too many attempts — please wait a bit and try again.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in your Firebase console yet.',
  }
  return map[code] || (err as Error)?.message || 'Something went wrong. Please try again.'
}
