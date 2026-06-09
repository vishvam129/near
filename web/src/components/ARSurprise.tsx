import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'

const EMOJIS = ['🎁', '💝', '🌹', '🎈', '💍', '🧸', '🍰', '⭐', '💌', '🦋']

// "AR surprise" (#77): one partner hides a virtual object + note; the other
// opens their camera and sees it floating in their space (camera-overlay AR —
// works on any phone with a camera, no headset or 3D engine needed).
export function ARSurprise() {
  const { user } = useAuth()
  const { couple, partner, paired, setArSurprise } = useCouple()
  const surprise = couple?.arSurprise ?? null
  const fromMe = surprise?.from === user?.uid

  const [emoji, setEmoji] = useState('🎁')
  const [note, setNote] = useState('')
  const [arOpen, setArOpen] = useState(false)
  const [camErr, setCamErr] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // object position (% of viewport) for the draggable overlay
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const dragging = useRef(false)

  useEffect(() => {
    if (!arOpen) return
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setCamErr('Couldn’t open the camera. Allow camera access and try again.'))
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [arOpen])

  if (!paired) return null

  function closeAr() {
    setArOpen(false)
    setCamErr(null)
  }

  function onDrag(e: PointerEvent) {
    if (!dragging.current) return
    setPos({
      x: Math.max(8, Math.min(92, (e.clientX / window.innerWidth) * 100)),
      y: Math.max(12, Math.min(88, (e.clientY / window.innerHeight) * 100)),
    })
  }

  // --- AR camera view ---
  if (arOpen && surprise) {
    return (
      <div
        className="ar-view"
        onPointerMove={onDrag}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        onPointerLeave={() => (dragging.current = false)}
      >
        <video ref={videoRef} className="ar-camera" autoPlay playsInline muted />
        {camErr ? (
          <div className="ar-camerr">{camErr}</div>
        ) : (
          <div
            className="ar-object"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onPointerDown={() => (dragging.current = true)}
          >
            <span className="ar-emoji">{surprise.emoji}</span>
            {surprise.note && <span className="ar-note">{surprise.note}</span>}
          </div>
        )}
        <div className="ar-hint">Drag the surprise around your space ✨</div>
        <div className="ar-actions">
          <button type="button" className="btn" onClick={closeAr}>
            Close (keep it)
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              void setArSurprise(null)
              closeAr()
            }}
          >
            Dismiss surprise
          </button>
        </div>
      </div>
    )
  }

  // --- a surprise is waiting for me ---
  if (surprise && !fromMe) {
    return (
      <div className="card ar-card">
        <h3 className="card-h muted-h">A surprise for you 🪄</h3>
        <p className="entry-empty">
          {partner?.name || 'Your partner'} hid something in your space. Open your camera to find it.
        </p>
        <button type="button" className="btn" onClick={() => setArOpen(true)}>
          Open in AR 📷
        </button>
      </div>
    )
  }

  // --- I already sent one ---
  if (surprise && fromMe) {
    return (
      <div className="card ar-card">
        <h3 className="card-h muted-h">AR surprise</h3>
        <div className="ar-sent">
          {surprise.emoji} floating in {partner?.name || 'their'} space
          {surprise.note ? ` — “${surprise.note}”` : ''}
        </div>
        <button type="button" className="link" onClick={() => void setArSurprise(null)}>
          Take it back
        </button>
      </div>
    )
  }

  // --- compose ---
  return (
    <div className="card ar-card">
      <h3 className="card-h muted-h">AR surprise</h3>
      <p className="entry-empty">
        Hide a virtual gift in {partner?.name || 'their'} space — they’ll find it through their
        camera.
      </p>
      <div className="ar-emoji-grid">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            className={`ar-pick ${emoji === e ? 'sel' : ''}`}
            onClick={() => setEmoji(e)}
          >
            {e}
          </button>
        ))}
      </div>
      <input
        className="input"
        type="text"
        maxLength={80}
        placeholder="A little note (optional)…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button
        type="button"
        className="btn"
        onClick={() => void setArSurprise({ emoji, note: note.trim().slice(0, 80) })}
      >
        Hide it in their space 🪄
      </button>
    </div>
  )
}
