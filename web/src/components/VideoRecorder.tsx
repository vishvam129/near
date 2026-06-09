import { useEffect, useRef, useState } from 'react'

const MAX_SEC = 30

// Records a short video message (#17). Hands the recorded Blob back to the
// parent, which uploads it to Cloudinary and sends it in chat.
export function VideoRecorder({
  onSend,
  onClose,
}: {
  onSend: (blob: Blob) => Promise<void>
  onClose: () => void
}) {
  const liveRef = useRef<HTMLVideoElement>(null)
  const playbackRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<number | undefined>(undefined)

  const [ready, setReady] = useState(false)
  const [recording, setRecording] = useState(false)
  const [secs, setSecs] = useState(0)
  const [recorded, setRecorded] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (liveRef.current) liveRef.current.srcObject = stream
        setReady(true)
      })
      .catch(() => setErr('Couldn’t access camera/microphone. Allow access and try again.'))
    return () => {
      cancelled = true
      if (timer.current) window.clearInterval(timer.current)
      recRef.current?.state === 'recording' && recRef.current.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    if (previewUrl && playbackRef.current) playbackRef.current.src = previewUrl
  }, [previewUrl])

  function start() {
    if (!streamRef.current) return
    chunks.current = []
    const mime = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : ''
    const rec = new MediaRecorder(streamRef.current, mime ? { mimeType: mime } : undefined)
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data)
    rec.onstop = () => {
      const blob = new Blob(chunks.current, { type: chunks.current[0]?.type || 'video/webm' })
      setRecorded(blob)
      setPreviewUrl(URL.createObjectURL(blob))
    }
    rec.start()
    recRef.current = rec
    setRecording(true)
    setSecs(0)
    timer.current = window.setInterval(() => {
      setSecs((s) => {
        if (s + 1 >= MAX_SEC) stop()
        return s + 1
      })
    }, 1000)
  }

  function stop() {
    if (timer.current) window.clearInterval(timer.current)
    if (recRef.current?.state === 'recording') recRef.current.stop()
    setRecording(false)
  }

  function retake() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setRecorded(null)
    setPreviewUrl(null)
    setSecs(0)
  }

  async function send() {
    if (!recorded) return
    setSending(true)
    setErr(null)
    try {
      await onSend(recorded)
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not send.')
      setSending(false)
    }
  }

  return (
    <div className="vid-rec">
      <div className="vid-rec-stage">
        {/* live camera (hidden once we have a recording to preview) */}
        <video
          ref={liveRef}
          className="vid-rec-video"
          autoPlay
          playsInline
          muted
          style={{ display: recorded ? 'none' : 'block' }}
        />
        {recorded && (
          <video ref={playbackRef} className="vid-rec-video" controls playsInline />
        )}
        {recording && <div className="vid-rec-dot">● {MAX_SEC - secs}s</div>}
      </div>

      {err && <div className="err vid-rec-err">{err}</div>}

      <div className="vid-rec-controls">
        {!recorded ? (
          <>
            <button type="button" className="link" onClick={onClose}>
              Cancel
            </button>
            {recording ? (
              <button type="button" className="btn vid-rec-stop" onClick={stop}>
                ⏹ Stop
              </button>
            ) : (
              <button type="button" className="btn vid-rec-go" onClick={start} disabled={!ready}>
                ● Record
              </button>
            )}
            <span className="vid-rec-spacer" />
          </>
        ) : (
          <>
            <button type="button" className="link" onClick={retake}>
              Retake
            </button>
            <button type="button" className="btn" onClick={() => void send()} disabled={sending}>
              {sending ? 'Sending…' : 'Send 🎥'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
