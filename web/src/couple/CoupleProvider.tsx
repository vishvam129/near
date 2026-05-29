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
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthProvider'

export type Profile = {
  uid: string
  name: string | null
  email: string | null
  photoURL: string | null
  timezone: string
  city: string
  inviteCode: string
  coupleId: string | null
}

export type ProfileEdits = {
  name?: string
  city?: string
  timezone?: string
  photoURL?: string | null
}

type CoupleContextValue = {
  loading: boolean
  profile: Profile | null
  partner: Profile | null
  inviteCode: string | null
  paired: boolean
  pairWithCode: (code: string) => Promise<void>
  updateProfile: (edits: ProfileEdits) => Promise<void>
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
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode()
    const snap = await getDoc(doc(db!, 'inviteCodes', code))
    if (!snap.exists()) return code
  }
  return randomCode(8)
}

function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

function toProfile(uid: string, d: DocumentData): Profile {
  return {
    uid,
    name: d.name ?? null,
    email: d.email ?? null,
    photoURL: d.photoURL ?? null,
    timezone: d.timezone || 'UTC',
    city: d.city ?? '',
    inviteCode: d.inviteCode ?? '',
    coupleId: d.coupleId ?? null,
  }
}

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [partner, setPartner] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // ---- own profile (create-if-absent, then live subscription) ----
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
      // Create-if-absent atomically so StrictMode's double-mount (or two tabs)
      // can't create duplicate/orphaned invite codes.
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        const code = await generateUniqueCode()
        await runTransaction(db!, async (tx) => {
          const fresh = await tx.get(ref)
          if (fresh.exists()) return
          tx.set(ref, {
            name: user!.displayName ?? null,
            email: user!.email ?? null,
            photoURL: user!.photoURL ?? null,
            timezone: browserTimezone(),
            city: '',
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
      unsub = onSnapshot(ref, (s) => {
        const d = s.data()
        if (d) setProfile(toProfile(user!.uid, d))
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

  // ---- partner profile (once paired) ----
  useEffect(() => {
    const coupleId = profile?.coupleId
    if (!db || !user || !coupleId) {
      setPartner(null)
      return
    }

    let unsub: (() => void) | undefined
    let cancelled = false

    async function loadPartner() {
      const coupleSnap = await getDoc(doc(db!, 'couples', coupleId!))
      const members: string[] = coupleSnap.data()?.members ?? []
      const partnerUid = members.find((m) => m !== user!.uid)
      if (!partnerUid || cancelled) return
      unsub = onSnapshot(doc(db!, 'users', partnerUid), (s) => {
        const d = s.data()
        setPartner(d ? toProfile(partnerUid, d) : null)
      })
    }

    loadPartner().catch((err) => console.error('Failed to load partner:', err))

    return () => {
      cancelled = true
      unsub?.()
    }
  }, [profile?.coupleId, user])

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

  async function updateProfile(edits: ProfileEdits) {
    if (!db || !user) throw new Error('Not signed in.')
    const patch: Record<string, unknown> = {}
    if (edits.name !== undefined) patch.name = edits.name.trim() || null
    if (edits.city !== undefined) patch.city = edits.city.trim()
    if (edits.timezone !== undefined) patch.timezone = edits.timezone
    if (edits.photoURL !== undefined) patch.photoURL = edits.photoURL?.trim() || null
    if (Object.keys(patch).length === 0) return
    await updateDoc(doc(db, 'users', user.uid), patch)
  }

  const value: CoupleContextValue = {
    loading,
    profile,
    partner,
    inviteCode: profile?.inviteCode ?? null,
    paired: Boolean(profile?.coupleId),
    pairWithCode,
    updateProfile,
  }

  return <CoupleContext.Provider value={value}>{children}</CoupleContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCouple() {
  const ctx = useContext(CoupleContext)
  if (!ctx) throw new Error('useCouple must be used within <CoupleProvider>')
  return ctx
}
