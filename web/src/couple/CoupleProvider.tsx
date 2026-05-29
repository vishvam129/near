import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  collection,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthProvider'

export type Profile = {
  uid: string
  name: string | null
  email: string | null
  inviteCode: string
  coupleId: string | null
}

type CoupleContextValue = {
  loading: boolean
  profile: Profile | null
  inviteCode: string | null
  paired: boolean
  /** Links the current user to the owner of `code`. Throws a friendly Error on failure. */
  pairWithCode: (code: string) => Promise<void>
}

const CoupleContext = createContext<CoupleContextValue | undefined>(undefined)

// Unambiguous alphabet (no 0/O, 1/I) for easy sharing by voice/text.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomCode(len = 6): string {
  const bytes = new Uint32Array(len)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return out
}

async function generateUniqueCode(): Promise<string> {
  // Collisions are astronomically unlikely, but verify to be safe.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode()
    const snap = await getDoc(doc(db!, 'inviteCodes', code))
    if (!snap.exists()) return code
  }
  return randomCode(8)
}

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !db) {
      setProfile(null)
      setLoading(false)
      return
    }

    let unsub: (() => void) | undefined
    let cancelled = false

    async function init() {
      const ref = doc(db!, 'users', user!.uid)
      // Create-if-absent atomically. Without a transaction, StrictMode's
      // double-mount (or two tabs on first login) could both pass the
      // existence check and write two different invite codes, orphaning one.
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        const code = await generateUniqueCode()
        await runTransaction(db!, async (tx) => {
          const fresh = await tx.get(ref)
          if (fresh.exists()) return // another run already created the profile
          tx.set(ref, {
            name: user!.displayName ?? null,
            email: user!.email ?? null,
            inviteCode: code,
            coupleId: null,
            createdAt: serverTimestamp(),
          })
          tx.set(doc(db!, 'inviteCodes', code), {
            uid: user!.uid,
            createdAt: serverTimestamp(),
          })
        })
      }
      if (cancelled) return
      // Live updates so the screen flips to the dashboard the instant pairing completes.
      unsub = onSnapshot(ref, (s) => {
        const d = s.data()
        if (d) {
          setProfile({
            uid: user!.uid,
            name: d.name ?? null,
            email: d.email ?? null,
            inviteCode: d.inviteCode ?? '',
            coupleId: d.coupleId ?? null,
          })
        }
        setLoading(false)
      })
    }

    setLoading(true)
    init().catch((err) => {
      console.error('Failed to load couple profile:', err)
      setLoading(false)
    })

    return () => {
      cancelled = true
      unsub?.()
    }
  }, [user])

  async function pairWithCode(rawCode: string) {
    if (!db || !user) throw new Error('Not signed in.')
    if (!profile) throw new Error('Still loading your profile — try again in a second.')

    const code = rawCode.trim().toUpperCase()
    if (!code) throw new Error('Enter your partner’s code.')
    if (code === profile.inviteCode) throw new Error('That’s your own code 🙂')

    const codeSnap = await getDoc(doc(db, 'inviteCodes', code))
    if (!codeSnap.exists()) throw new Error('That code doesn’t exist — double-check it.')
    const partnerUid = codeSnap.data().uid as string
    if (partnerUid === user.uid) throw new Error('That’s your own code 🙂')

    await runTransaction(db, async (tx) => {
      const meRef = doc(db!, 'users', user.uid)
      const partnerRef = doc(db!, 'users', partnerUid)
      const meDoc = await tx.get(meRef)
      const partnerDoc = await tx.get(partnerRef)

      if (!partnerDoc.exists()) throw new Error('That account no longer exists.')
      if (meDoc.data()?.coupleId) throw new Error('You’re already paired with someone.')
      if (partnerDoc.data()?.coupleId)
        throw new Error('That person is already paired with someone else.')

      const coupleRef = doc(collection(db!, 'couples'))
      tx.set(coupleRef, {
        members: [partnerUid, user.uid],
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      })
      tx.update(meRef, { coupleId: coupleRef.id })
      tx.update(partnerRef, { coupleId: coupleRef.id })
    })
  }

  const value: CoupleContextValue = {
    loading,
    profile,
    inviteCode: profile?.inviteCode ?? null,
    paired: Boolean(profile?.coupleId),
    pairWithCode,
  }

  return <CoupleContext.Provider value={value}>{children}</CoupleContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCouple() {
  const ctx = useContext(CoupleContext)
  if (!ctx) throw new Error('useCouple must be used within <CoupleProvider>')
  return ctx
}
