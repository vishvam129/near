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
  const subs = useRef<Array<() => void>>([])

  function cleanup() {
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
    try {
      const stream = await getMedia(t)
      localRef.current = stream
      setLocalStream(stream)
      setType(t)
      setStatus('outgoing')

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
    try {
      // Read current call data via a one-shot listener already running? Re-fetch.
      const stream = await getMedia(type ?? 'voice')
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
  const offerRef = useRef<{ type: RTCSdpType; sdp: string } | null>(null)
  useEffect(() => {
    if (!db || !coupleId || !user) return
    const q = query(
      collection(db, 'couples', coupleId, 'calls'),
      where('status', '==', 'ringing'),
    )
    return onSnapshot(q, (snap) => {
      // Ignore while already in a call.
      if (status !== 'idle') return
      // Only ring once the offer has actually been written to the doc.
      const ring = snap.docs.find((d) => {
        const x = d.data()
        return x.callee === user.uid && x.caller !== user.uid && x.offer
      })
      if (ring) {
        const d = ring.data()
        incomingId.current = ring.id
        offerRef.current = d.offer ?? null
        setType((d.type as CallType) ?? 'voice')
        setStatus('incoming')
      }
    })
  }, [coupleId, user, status])

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
