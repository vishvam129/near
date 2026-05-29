import { useAuth } from '../auth/AuthProvider'

// Placeholder authenticated screen. The real couple dashboard (clocks,
// countdown, chat, etc.) arrives in later features/waves — this just proves
// sign-in works and gives you a way to sign back out.
export default function Home() {
  const { user, logout } = useAuth()
  const who = user?.displayName || user?.email || 'love'

  return (
    <div className="auth-wrap">
      <div className="card">
        <div className="brand">
          <span className="dot" /> Near
        </div>
        <h1 className="welcome">Hi, {who} 💗</h1>
        <p className="tagline">
          You’re signed in. Your couple dashboard is coming next — clocks, countdown,
          chat, and shared moments.
        </p>
        <button className="btn btn-ghost" type="button" onClick={() => void logout()}>
          Sign out
        </button>
      </div>
    </div>
  )
}
