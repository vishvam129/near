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

export type Meetup = { date: string; place: string }

export type CoupleDoc = {
  id: string
  members: string[]
  nextMeetup: Meetup | null
  sinceDate: string | null
  createdAt: Date | null
  typing: Record<string, boolean>
  lastRead: Record<string, Date | null>
  poke: { from: string; at: Date | null } | null
}

type CoupleContextValue = {
  loading: boolean
  profile: Profile | null
  partner: Profile | null
  couple: CoupleDoc | null
  inviteCode: string | null
  paired: boolean
  pairWithCode: (code: string) => Promise<void>
  updateProfile: (edits: ProfileEdits) => Promise<void>
  updateMeetup: (meetup: Meetup | null) => Promise<void>
  updateSince: (date: string | null) => Promise<void>
  setTyping: (typing: boolean) => Promise<void>
  markRead: () => Promise<void>
  sendPoke: () => Promise<void>
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
  const [couple, setCouple] = useState<CoupleDoc | null>(null)
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

  // ---- couple doc (live: nextMeetup, sinceDate, members) ----
  useEffect(() => {
    const coupleId = profile?.coupleId
    if (!db || !coupleId) {
      setCouple(null)
      return
    }
    return onSnapshot(doc(db, 'couples', coupleId), (s) => {
      const d = s.data()
      if (!d) {
        setCouple(null)
        return
      }
      const lastRead: Record<string, Date | null> = {}
      const lr = d.lastRead ?? {}
      for (const k of Object.keys(lr)) lastRead[k] = lr[k]?.toDate?.() ?? null
      setCouple({
        id: s.id,
        members: d.members ?? [],
        nextMeetup: d.nextMeetup ?? null,
        sinceDate: d.sinceDate ?? null,
        createdAt: d.createdAt?.toDate?.() ?? null,
        typing: d.typing ?? {},
        lastRead,
        poke: d.poke ? { from: d.poke.from, at: d.poke.at?.toDate?.() ?? null } : null,
      })
    })
  }, [profile?.coupleId])

  // ---- partner profile (derived from couple members) ----
  useEffect(() => {
    if (!db || !user || !couple) {
      setPartner(null)
      return
    }
    const partnerUid = couple.members.find((m) => m !== user.uid)
    if (!partnerUid) {
      setPartner(null)
      return
    }
    return onSnapshot(doc(db, 'users', partnerUid), (s) => {
      const d = s.data()
      setPartner(d ? toProfile(partnerUid, d) : null)
    })
  }, [couple, user])

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

  async function updateMeetup(meetup: Meetup | null) {
    if (!db || !couple) throw new Error('Not connected yet.')
    await updateDoc(doc(db, 'couples', couple.id), { nextMeetup: meetup })
  }

  async function updateSince(date: string | null) {
    if (!db || !couple) throw new Error('Not connected yet.')
    await updateDoc(doc(db, 'couples', couple.id), { sinceDate: date })
  }

  async function setTyping(typing: boolean) {
    if (!db || !user || !couple) return
    try {
      await updateDoc(doc(db, 'couples', couple.id), { [`typing.${user.uid}`]: typing })
    } catch {
      /* typing is best-effort; ignore transient failures */
    }
  }

  async function markRead() {
    if (!db || !user || !couple) return
    try {
      await updateDoc(doc(db, 'couples', couple.id), {
        [`lastRead.${user.uid}`]: serverTimestamp(),
      })
    } catch {
      /* read receipts are best-effort */
    }
  }

  async function sendPoke() {
    if (!db || !user || !couple) throw new Error('Not connected yet.')
    await updateDoc(doc(db, 'couples', couple.id), {
      poke: { from: user.uid, at: serverTimestamp() },
    })
  }

  const value: CoupleContextValue = {
    loading,
    profile,
    partner,
    couple,
    inviteCode: profile?.inviteCode ?? null,
    paired: Boolean(profile?.coupleId),
    pairWithCode,
    updateProfile,
    updateMeetup,
    updateSince,
    setTyping,
    markRead,
    sendPoke,
  }

  return <CoupleContext.Provider value={value}>{children}</CoupleContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCouple() {
  const ctx = useContext(CoupleContext)
  if (!ctx) throw new Error('useCouple must be used within <CoupleProvider>')
  return ctx
}
