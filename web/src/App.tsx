import { useAuth } from './auth/AuthProvider'
import { useCouple } from './couple/CoupleProvider'
import SignIn from './pages/SignIn'
import Pairing from './pages/Pairing'
import Home from './pages/Home'

function Loading() {
  return (
    <div className="auth-wrap">
      <div className="spinner" aria-label="Loading" />
    </div>
  )
}

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const { loading: coupleLoading, paired } = useCouple()

  if (authLoading) return <Loading />
  if (!user) return <SignIn />
  if (coupleLoading) return <Loading />
  return paired ? <Home /> : <Pairing />
}
