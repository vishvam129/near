import { useAuth } from './auth/AuthProvider'
import SignIn from './pages/SignIn'
import Home from './pages/Home'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-wrap">
        <div className="spinner" aria-label="Loading" />
      </div>
    )
  }

  return user ? <Home /> : <SignIn />
}
