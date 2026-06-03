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
  deleteField,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthProvider'
import { utcDayKey } from '../lib/format'

export type Profile = {
  uid: string
  name: string | null
  email: string | null
  photoURL: string | null
  timezone: string
  city: string
  inviteCode: string
  coupleId: string | null
  lastActive: Date | null
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
  moods: Record<string, string>
  watch: WatchState | null
  streak: { count: number; lastDay: string } | null
  greeting: { type: string; from: string; at: Date | null } | null
  wyr: { idx: number; picks: Record<string, 'a' | 'b'> } | null
  savings: { target: number; saved: number; label: string } | null
  ttt: { cells: string; turn: string; x: string } | null
  recipe: string | null
  cookEndsAt: number | null
  sleeping: Record<string, boolean>
  alarm: { at: number; label: string; setBy: string } | null
  scene: string | null
  signal: { type: string; from: string; color: string | null; at: Date | null } | null
  battery: Record<string, { level: number; charging: boolean; at: Date | null }>
  loveLang: Record<string, string>
  pinnedNote: { from: string; text: string; at: Date | null } | null
  cycle: Record<string, { start: string; length: number }>
  geo: Record<string, { lat: number; lng: number; at: Date | null }>
  avatars: Record<string, { face: string; color: string }>
  courses: Record<string, number>
}

export type WatchState = {
  videoId: string
  playing: boolean
  positionSec: number
  updatedBy: string
  updatedAt: number
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
  setMood: (emoji: string) => Promise<void>
  updateWatch: (w: { videoId: string; playing: boolean; positionSec: number }) => Promise<void>
  bumpStreak: () => Promise<void>
  sendGreeting: (type: string) => Promise<void>
  newWyr: (idx: number) => Promise<void>
  pickWyr: (choice: 'a' | 'b') => Promise<void>
  setSavingsGoal: (target: number, label: string) => Promise<void>
  addToSavings: (amount: number) => Promise<void>
  newTtt: () => Promise<void>
  playTtt: (i: number) => Promise<void>
  setRecipe: (recipe: string | null) => Promise<void>
  setCookTimer: (endsAt: number | null) => Promise<void>
  setSleeping: (asleep: boolean) => Promise<void>
  setAlarm: (alarm: { at: number; label: string } | null) => Promise<void>
  setScene: (scene: string | null) => Promise<void>
  sendSignal: (type: 'lamp' | 'kiss' | 'heartbeat', color?: string) => Promise<void>
  updateBattery: (level: number, charging: boolean) => Promise<void>
  setLoveLang: (lang: string) => Promise<void>
  setPinnedNote: (text: string | null) => Promise<void>
  setCycle: (info: { start: string; length: number } | null) => Promise<void>
  setGeo: (lat: number, lng: number) => Promise<void>
  setAvatar: (face: string, color: string) => Promise<void>
  setCourseProgress: (courseId: string, lesson: number) => Promise<void>
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
    lastActive: d.lastActive?.toDate?.() ?? null,
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

  // ---- presence heartbeat: keep our own lastActive fresh while app is open ----
  useEffect(() => {
    if (!db || !user) return
    let cancelled = false
    const ref = doc(db, 'users', user.uid)
    const touch = () => {
      if (!cancelled) updateDoc(ref, { lastActive: serverTimestamp() }).catch(() => {})
    }
    touch()
    const id = window.setInterval(touch, 40_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') touch()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', touch)
    return () => {
      cancelled = true
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', touch)
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
        moods: d.moods ?? {},
        watch: d.watch ?? null,
        streak: d.streak ?? null,
        greeting: d.greeting
          ? { type: d.greeting.type, from: d.greeting.from, at: d.greeting.at?.toDate?.() ?? null }
          : null,
        wyr: d.wyr ?? null,
        savings: d.savings ?? null,
        ttt: d.ttt ?? null,
        recipe: d.recipe ?? null,
        cookEndsAt: d.cookEndsAt ?? null,
        sleeping: d.sleeping ?? {},
        alarm: d.alarm ?? null,
        scene: d.scene ?? null,
        signal: d.signal
          ? {
              type: d.signal.type,
              from: d.signal.from,
              color: d.signal.color ?? null,
              at: d.signal.at?.toDate?.() ?? null,
            }
          : null,
        battery: Object.fromEntries(
          Object.entries(d.battery ?? {}).map(([uid, b]) => {
            const v = b as { level?: number; charging?: boolean; at?: { toDate?: () => Date } }
            return [
              uid,
              {
                level: Number(v.level) || 0,
                charging: Boolean(v.charging),
                at: v.at?.toDate?.() ?? null,
              },
            ]
          }),
        ),
        loveLang: d.loveLang ?? {},
        pinnedNote: d.pinnedNote
          ? {
              from: d.pinnedNote.from,
              text: d.pinnedNote.text ?? '',
              at: d.pinnedNote.at?.toDate?.() ?? null,
            }
          : null,
        cycle: Object.fromEntries(
          Object.entries(d.cycle ?? {}).map(([uid, c]) => {
            const v = c as { start?: string; length?: number }
            return [uid, { start: v.start ?? '', length: Number(v.length) || 28 }]
          }),
        ),
        geo: Object.fromEntries(
          Object.entries(d.geo ?? {}).map(([uid, g]) => {
            const v = g as { lat?: number; lng?: number; at?: { toDate?: () => Date } }
            return [
              uid,
              { lat: Number(v.lat) || 0, lng: Number(v.lng) || 0, at: v.at?.toDate?.() ?? null },
            ]
          }),
        ),
        avatars: Object.fromEntries(
          Object.entries(d.avatars ?? {}).map(([uid, a]) => {
            const v = a as { face?: string; color?: string }
            return [uid, { face: v.face ?? '🙂', color: v.color ?? '#ff5d8f' }]
          }),
        ),
        courses: d.courses ?? {},
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

  async function setMood(emoji: string) {
    if (!db || !user || !couple) return
    await updateDoc(doc(db, 'couples', couple.id), { [`moods.${user.uid}`]: emoji })
  }

  async function sendSignal(type: 'lamp' | 'kiss' | 'heartbeat', color?: string) {
    if (!db || !user || !couple) throw new Error('Not connected yet.')
    await updateDoc(doc(db, 'couples', couple.id), {
      signal: { type, from: user.uid, color: color ?? null, at: serverTimestamp() },
    })
  }

  async function updateBattery(level: number, charging: boolean) {
    if (!db || !user || !couple) return
    await updateDoc(doc(db, 'couples', couple.id), {
      [`battery.${user.uid}`]: { level, charging, at: serverTimestamp() },
    })
  }

  async function setLoveLang(lang: string) {
    if (!db || !user || !couple) return
    await updateDoc(doc(db, 'couples', couple.id), { [`loveLang.${user.uid}`]: lang })
  }

  async function setPinnedNote(text: string | null) {
    if (!db || !user || !couple) return
    await updateDoc(doc(db, 'couples', couple.id), {
      pinnedNote: text ? { from: user.uid, text, at: serverTimestamp() } : deleteField(),
    })
  }

  async function setCycle(info: { start: string; length: number } | null) {
    if (!db || !user || !couple) return
    await updateDoc(doc(db, 'couples', couple.id), {
      [`cycle.${user.uid}`]: info ?? deleteField(),
    })
  }

  async function setGeo(lat: number, lng: number) {
    if (!db || !user || !couple) return
    await updateDoc(doc(db, 'couples', couple.id), {
      [`geo.${user.uid}`]: { lat, lng, at: serverTimestamp() },
    })
  }

  async function setAvatar(face: string, color: string) {
    if (!db || !user || !couple) return
    await updateDoc(doc(db, 'couples', couple.id), {
      [`avatars.${user.uid}`]: { face, color },
    })
  }

  async function setCourseProgress(courseId: string, lesson: number) {
    if (!db || !user || !couple) return
    await updateDoc(doc(db, 'couples', couple.id), { [`courses.${courseId}`]: lesson })
  }

  async function setSavingsGoal(target: number, label: string) {
    if (!db || !couple) return
    const saved = couple.savings?.saved ?? 0
    await updateDoc(doc(db, 'couples', couple.id), { savings: { target, label, saved } })
  }

  async function addToSavings(amount: number) {
    if (!db || !couple || amount <= 0) return
    const ref = doc(db, 'couples', couple.id)
    // Transaction reads the current savings object and writes the whole thing
    // back with an updated `saved` — robust regardless of field shape, and
    // race-safe between the two partners.
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref)
      const sav = snap.data()?.savings
      if (!sav) return
      tx.update(ref, {
        savings: {
          target: Number(sav.target) || 0,
          label: sav.label ?? '',
          saved: (Number(sav.saved) || 0) + amount,
        },
      })
    })
  }

  function partnerUidOf(): string | null {
    if (!couple || !user) return null
    return couple.members.find((m) => m !== user.uid) ?? null
  }

  async function newTtt() {
    if (!db || !user || !couple) return
    await updateDoc(doc(db, 'couples', couple.id), {
      ttt: { cells: '         ', turn: user.uid, x: user.uid },
    })
  }

  async function playTtt(i: number) {
    if (!db || !user || !couple?.ttt) return
    const t = couple.ttt
    const pUid = partnerUidOf()
    if (t.turn !== user.uid || !pUid) return
    if (t.cells[i] !== ' ') return
    const mark = user.uid === t.x ? 'X' : 'O'
    const cells = t.cells.substring(0, i) + mark + t.cells.substring(i + 1)
    await updateDoc(doc(db, 'couples', couple.id), { ttt: { ...t, cells, turn: pUid } })
  }

  async function setScene(scene: string | null) {
    if (!db || !couple) return
    await updateDoc(doc(db, 'couples', couple.id), { scene })
  }

  async function setSleeping(asleep: boolean) {
    if (!db || !user || !couple) return
    await updateDoc(doc(db, 'couples', couple.id), { [`sleeping.${user.uid}`]: asleep })
  }

  async function setAlarm(alarm: { at: number; label: string } | null) {
    if (!db || !user || !couple) return
    await updateDoc(doc(db, 'couples', couple.id), {
      alarm: alarm ? { ...alarm, setBy: user.uid } : null,
    })
  }

  async function setRecipe(recipe: string | null) {
    if (!db || !couple) return
    await updateDoc(doc(db, 'couples', couple.id), { recipe })
  }

  async function setCookTimer(endsAt: number | null) {
    if (!db || !couple) return
    await updateDoc(doc(db, 'couples', couple.id), { cookEndsAt: endsAt })
  }

  async function sendGreeting(type: string) {
    if (!db || !user || !couple) return
    await updateDoc(doc(db, 'couples', couple.id), {
      greeting: { type, from: user.uid, at: serverTimestamp() },
    })
  }

  async function newWyr(idx: number) {
    if (!db || !couple) return
    await updateDoc(doc(db, 'couples', couple.id), { wyr: { idx, picks: {} } })
  }

  async function pickWyr(choice: 'a' | 'b') {
    if (!db || !user || !couple?.wyr) return
    await updateDoc(doc(db, 'couples', couple.id), { [`wyr.picks.${user.uid}`]: choice })
  }

  async function updateWatch(w: { videoId: string; playing: boolean; positionSec: number }) {
    if (!db || !user || !couple) return
    await updateDoc(doc(db, 'couples', couple.id), {
      watch: { ...w, updatedBy: user.uid, updatedAt: Date.now() },
    })
  }

  async function bumpStreak() {
    if (!db || !couple) return
    const coupleRef = doc(db, 'couples', couple.id)
    const today = utcDayKey()
    const yesterday = utcDayKey(-1)
    // Transaction so two clients bumping at once can't double-count or clobber.
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(coupleRef)
      const s = snap.data()?.streak as { count: number; lastDay: string } | undefined
      if (s?.lastDay === today) return
      const count = s?.lastDay === yesterday ? s.count + 1 : 1
      tx.update(coupleRef, { streak: { count, lastDay: today } })
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
    sendSignal,
    updateBattery,
    setLoveLang,
    setPinnedNote,
    setCycle,
    setGeo,
    setAvatar,
    setCourseProgress,
    setMood,
    updateWatch,
    bumpStreak,
    sendGreeting,
    newWyr,
    pickWyr,
    setSavingsGoal,
    addToSavings,
    newTtt,
    playTtt,
    setRecipe,
    setCookTimer,
    setSleeping,
    setAlarm,
    setScene,
  }

  return <CoupleContext.Provider value={value}>{children}</CoupleContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCouple() {
  const ctx = useContext(CoupleContext)
  if (!ctx) throw new Error('useCouple must be used within <CoupleProvider>')
  return ctx
}
