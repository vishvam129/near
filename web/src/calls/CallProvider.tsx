import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'

// Voice / video / sleep calls (#52/53/54) over WebRTC, using Firestore as the
// signaling channel — no paid service. Offer/answer + ICE candidates flow
// through couples/{id}/calls/{callId} and its candidate subcollections.

export type CallType = 'voice' | 'video' | 'sleep'
export type CallStatus = 'idle' | 'outgoing' | 'incoming' | 'active' | 'ended'

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ],
}

type CallValue = {
  status: CallStatus
  type: CallType | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  muted: boolean
  cameraOff: boolean
  error: string | null
  startCall: (type: CallType) => Promise<void>
  acceptCall: () => Promise<void>
  declineCall: () => Promise<void>
  hangUp: () => Promise<void>
  toggleMute: () => void
  toggleCamera: () => void
}

const CallContext = createContext<CallValue | undefined>(undefined)

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { couple, partner } = useCouple()
  const coupleId = couple?.id ?? null

  const [status, setStatus] = useState<CallStatus>('idle')
  const [type, setType] = useState<CallType | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localRef = useRef<MediaStream | null>(null)
  const callDocId = useRef<string | null>(null)
  const incomingId = useRef<string | null>(null)
  const offerRef = useRef<{ type: RTCSdpType; sdp: string } | null>(null)
  const subs = useRef<Array<() => void>>([])
  // Generation token: bumped on every teardown so an in-flight start/accept
  // that resolves *after* teardown can detect it's stale and stop its tracks
  // instead of re-assigning live media (prevents a camera/mic leak).
  const gen = useRef(0)
  const ringTimer = useRef<number | undefined>(undefined)
  // Mirror of `status` for the once-subscribed incoming watcher.
  const statusRef = useRef<CallStatus>('idle')
  statusRef.current = status

  function cleanup() {
    gen.current++
    if (ringTimer.current) window.clearTimeout(ringTimer.current)
    ringTimer.current = undefined
    subs.current.forEach((u) => u())
    subs.current = []
    pcRef.current?.close()
    pcRef.current = null
    localRef.current?.getTracks().forEach((t) => t.stop())
    localRef.current = null
    setLocalStream(null)
    setRemoteStream(null)
    setMuted(false)
    setCameraOff(false)
    callDocId.current = null
    incomingId.current = null
    offerRef.current = null
  }

  function teardown(next: CallStatus = 'idle') {
    cleanup()
    setStatus(next)
    setType(null)
    if (next === 'ended') {
      window.setTimeout(() => setStatus((s) => (s === 'ended' ? 'idle' : s)), 1500)
    }
  }

  async function getMedia(t: CallType): Promise<MediaStream> {
    const constraints: MediaStreamConstraints =
      t === 'video' ? { audio: true, video: true } : { audio: true, video: false }
    return navigator.mediaDevices.getUserMedia(constraints)
  }

  function makePeer(callId: string, localSub: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_CONFIG)
    localRef.current?.getTracks().forEach((track) => pc.addTrack(track, localRef.current!))
    const remote = new MediaStream()
    setRemoteStream(remote)
    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach((tr) => remote.addTrack(tr))
    }
    pc.onicecandidate = (e) => {
      if (e.candidate && db && coupleId) {
        void addDoc(collection(db, 'couples', coupleId, 'calls', callId, localSub), e.candidate.toJSON())
      }
    }
    return pc
  }

  // ---- caller ----
  async function startCall(t: CallType) {
    if (!db || !coupleId || !user || !partner) return
    if (status !== 'idle') return
    setError(null)
    const myGen = gen.current
    try {
      const stream = await getMedia(t)
      // If a teardown happened while we were awaiting permission, abort.
      if (myGen !== gen.current) {
        stream.getTracks().forEach((tk) => tk.stop())
        return
      }
      localRef.current = stream
      setLocalStream(stream)
      setType(t)
      setStatus('outgoing')
      // Give up ringing if unanswered after 40s.
      ringTimer.current = window.setTimeout(() => {
        if (statusRef.current === 'outgoing') void hangUp()
      }, 40000)

      const callRef = await addDoc(collection(db, 'couples', coupleId, 'calls'), {
        type: t,
        caller: user.uid,
        callee: partner.uid,
        status: 'ringing',
        offer: null,
        answer: null,
        createdAt: serverTimestamp(),
      })
      callDocId.current = callRef.id

      const pc = makePeer(callRef.id, 'callerCandidates')
      pcRef.current = pc

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      await updateDoc(callRef, { offer: { type: offer.type, sdp: offer.sdp } })
      // Aborted mid-setup → close the peer and end the call doc.
      if (myGen !== gen.current) {
        pc.close()
        await updateDoc(callRef, { status: 'ended' }).catch(() => {})
        return
      }

      // Watch for the answer + status changes.
      subs.current.push(
        onSnapshot(callRef, (snap) => {
          const d = snap.data()
          if (!d) return
          if (d.answer && pcRef.current && !pcRef.current.currentRemoteDescription) {
            pcRef.current.setRemoteDescription(new RTCSessionDescription(d.answer))
            setStatus('active')
          }
          if (d.status === 'ended' || d.status === 'declined') teardown('ended')
        }),
      )
      // Add the callee's ICE candidates as they arrive.
      subs.current.push(
        onSnapshot(collection(db, 'couples', coupleId, 'calls', callRef.id, 'calleeCandidates'), (snap) => {
          snap.docChanges().forEach((c) => {
            if (c.type === 'added' && pcRef.current) {
              pcRef.current.addIceCandidate(new RTCIceCandidate(c.doc.data()))
            }
          })
        }),
      )
    } catch (e) {
      setError(mediaError(e))
      teardown('idle')
    }
  }

  // ---- callee ----
  async function acceptCall() {
    if (!db || !coupleId || !user || !incomingId.current) return
    const callId = incomingId.current
    const callRef = doc(db, 'couples', coupleId, 'calls', callId)
    const myGen = gen.current
    try {
      const stream = await getMedia(type ?? 'voice')
      if (myGen !== gen.current) {
        stream.getTracks().forEach((tk) => tk.stop())
        return
      }
      localRef.current = stream
      setLocalStream(stream)

      const pc = makePeer(callId, 'calleeCandidates')
      pcRef.current = pc
      callDocId.current = callId

      // Read the offer fresh from the doc (avoids any stale-snapshot race).
      const callSnap = await getDoc(callRef)
      const offer = callSnap.data()?.offer ?? offerRef.current
      if (!offer) throw new Error('Call offer missing')
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      if (myGen !== gen.current) {
        pc.close()
        return
      }
      await updateDoc(callRef, { answer: { type: answer.type, sdp: answer.sdp }, status: 'active' })

      setStatus('active')
      subs.current.push(
        onSnapshot(callRef, (snap) => {
          const d = snap.data()
          if (d && (d.status === 'ended' || d.status === 'declined')) teardown('ended')
        }),
      )
      subs.current.push(
        onSnapshot(collection(db, 'couples', coupleId, 'calls', callId, 'callerCandidates'), (snap) => {
          snap.docChanges().forEach((c) => {
            if (c.type === 'added' && pcRef.current) {
              pcRef.current.addIceCandidate(new RTCIceCandidate(c.doc.data()))
            }
          })
        }),
      )
    } catch (e) {
      setError(mediaError(e))
      await updateDoc(callRef, { status: 'ended' }).catch(() => {})
      teardown('idle')
    }
  }

  async function declineCall() {
    if (db && coupleId && incomingId.current) {
      await updateDoc(doc(db, 'couples', coupleId, 'calls', incomingId.current), {
        status: 'declined',
      }).catch(() => {})
    }
    incomingId.current = null
    offerRef.current = null
    teardown('idle')
  }

  async function hangUp() {
    const id = callDocId.current || incomingId.current
    if (db && coupleId && id) {
      await updateDoc(doc(db, 'couples', coupleId, 'calls', id), { status: 'ended' }).catch(() => {})
    }
    teardown('ended')
  }

  function toggleMute() {
    const next = !muted
    localRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next))
    setMuted(next)
  }
  function toggleCamera() {
    const next = !cameraOff
    localRef.current?.getVideoTracks().forEach((t) => (t.enabled = !next))
    setCameraOff(next)
  }

  // ---- incoming-call watcher ----
  // Subscribed once (reads live status via statusRef) so it never tears down
  // and replays stale results on a status change.
  useEffect(() => {
    if (!db || !coupleId || !user) return
    const database = db
    const cid = coupleId
    const uid = user.uid
    const q = query(collection(database, 'couples', cid, 'calls'), where('status', '==', 'ringing'))
    return onSnapshot(q, (snap) => {
      if (statusRef.current !== 'idle' && statusRef.current !== 'outgoing') return
      const now = Date.now()
      const ring = snap.docs.find((d) => {
        const x = d.data()
        if (x.callee !== uid || x.caller === uid || !x.offer) return false
        // Ignore stale ringing docs (caller vanished without hanging up).
        const created = x.createdAt?.toMillis?.() ?? 0
        return created === 0 || now - created < 60000
      })
      if (!ring) return
      // Glare: if I'm already calling out and they call me too, the lower uid
      // wins (keeps their outgoing call); the higher uid yields and answers.
      if (statusRef.current === 'outgoing') {
        if (uid < ring.data().caller) return
        // Yield: synchronously cancel my own outgoing call (end its doc + stop
        // my media) BEFORE switching to their incoming call, so cleanup can't
        // clobber the 'incoming' state we set below.
        if (callDocId.current) {
          void updateDoc(doc(database, 'couples', cid, 'calls', callDocId.current), {
            status: 'ended',
          }).catch(() => {})
        }
        cleanup()
      }
      const d = ring.data()
      incomingId.current = ring.id
      offerRef.current = d.offer ?? null
      setType((d.type as CallType) ?? 'voice')
      setStatus('incoming')
    })
  }, [coupleId, user])

  // Best-effort: mark an in-flight call ended if the tab closes mid-call.
  useEffect(() => {
    const onLeave = () => {
      const id = callDocId.current || incomingId.current
      if (db && coupleId && id) {
        void updateDoc(doc(db, 'couples', coupleId, 'calls', id), { status: 'ended' }).catch(() => {})
      }
    }
    window.addEventListener('pagehide', onLeave)
    return () => window.removeEventListener('pagehide', onLeave)
  }, [coupleId])

  useEffect(() => () => cleanup(), [])

  const value: CallValue = {
    status,
    type,
    localStream,
    remoteStream,
    muted,
    cameraOff,
    error,
    startCall,
    acceptCall,
    declineCall,
    hangUp,
    toggleMute,
    toggleCamera,
  }
  return <CallContext.Provider value={value}>{children}</CallContext.Provider>
}

function mediaError(e: unknown): string {
  const name = e instanceof Error ? e.name : ''
  if (name === 'NotAllowedError') return 'Camera/microphone permission was blocked.'
  if (name === 'NotFoundError') return 'No camera or microphone found.'
  return e instanceof Error ? e.message : 'Could not start the call.'
}

export function useCall(): CallValue {
  const ctx = useContext(CallContext)
  if (!ctx) throw new Error('useCall must be used within CallProvider')
  return ctx
}
