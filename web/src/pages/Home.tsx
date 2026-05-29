import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'

// Placeholder authenticated + paired screen. The real couple dashboard (clocks,
// countdown, chat, etc.) arrives in later features/waves — this confirms sign-in
// and pairing both work.
export default function Home() {
  const { user, logout } = useAuth()
  const { paired } = useCouple()
  const who = user?.displayName || user?.email || 'love'

  return (
    <div className="auth-wrap">
      <div className="card">
        <div className="brand">
          <span className="dot" /> Near
        </div>
        <h1 className="welcome">Hi, {who} 💗</h1>
        {paired && <div className="paired-badge">💞 You’re connected</div>}
        <p className="tagline">
          You’re signed in and paired. Your couple dashboard is coming next — clocks,
          countdown, chat, and shared moments.
        </p>
        <button className="btn btn-ghost" type="button" onClick={() => void logout()}>
          Sign out
        </button>
      </div>
    </div>
  )
}
