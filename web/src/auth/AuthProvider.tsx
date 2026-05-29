import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth, googleProvider, firebaseEnabled } from '../lib/firebase'

type AuthContextValue = {
  user: User | null
  loading: boolean
  /** True once Firebase keys are configured in web/.env */
  ready: boolean
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const NOT_CONFIGURED =
  'Firebase is not configured yet. Add your keys to web/.env (see web/.env.example), then restart the dev server.'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const requireAuth = () => {
      if (!auth) throw new Error(NOT_CONFIGURED)
      return auth
    }
    return {
      user,
      loading,
      ready: firebaseEnabled,
      async signUp(email, password, name) {
        const cred = await createUserWithEmailAndPassword(requireAuth(), email, password)
        if (name) await updateProfile(cred.user, { displayName: name })
      },
      async signIn(email, password) {
        await signInWithEmailAndPassword(requireAuth(), email, password)
      },
      async signInWithGoogle() {
        await signInWithPopup(requireAuth(), googleProvider)
      },
      async logout() {
        await signOut(requireAuth())
      },
    }
  }, [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
