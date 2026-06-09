import { useEffect, useRef } from 'react'
import { useCall } from '../calls/CallProvider'
import { useCouple } from '../couple/CoupleProvider'

export function CallUI() {
  const { partner } = useCouple()
  const {
    status,
    type,
    localStream,
    remoteStream,
    muted,
    cameraOff,
    error,
    acceptCall,
    declineCall,
    hangUp,
    toggleMute,
    toggleCamera,
  } = useCall()

  const localVideo = useRef<HTMLVideoElement>(null)
  const remoteVideo = useRef<HTMLVideoElement>(null)
  const remoteAudio = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (localVideo.current) localVideo.current.srcObject = localStream
  }, [localStream])
  useEffect(() => {
    if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream
    if (remoteAudio.current) remoteAudio.current.srcObject = remoteStream
  }, [remoteStream])

  const who = partner?.name || 'Partner'

  if (status === 'idle') return null

  // Incoming call — ringing banner.
  if (status === 'incoming') {
    const label = type === 'video' ? 'video call' : type === 'sleep' ? 'sleep call' : 'voice call'
    return (
      <div className="call-incoming">
        <div className="call-ring-emoji">{type === 'video' ? '📹' : '📞'}</div>
        <div className="call-ring-name">{who}</div>
        <div className="call-ring-sub">Incoming {label}…</div>
        <div className="call-ring-actions">
          <button type="button" className="call-btn call-decline" onClick={() => void declineCall()}>
            Decline
          </button>
          <button type="button" className="call-btn call-accept" onClick={() => void acceptCall()}>
            Accept
          </button>
        </div>
      </div>
    )
  }

  const isVideo = type === 'video'
  const isSleep = type === 'sleep'

  return (
    <div className={`call-overlay ${isSleep ? 'call-sleep' : ''}`}>
      {/* hidden audio sink so voice calls play even with no video element */}
      <audio ref={remoteAudio} autoPlay playsInline />

      {isVideo ? (
        <>
          <video ref={remoteVideo} className="call-remote-video" autoPlay playsInline />
          <video ref={localVideo} className="call-local-video" autoPlay playsInline muted />
        </>
      ) : (
        <div className="call-voice-face">
          <div className="call-avatar">{isSleep ? '🌙' : '📞'}</div>
          <div className="call-ring-name">{who}</div>
          <div className="call-ring-sub">
            {status === 'outgoing' ? 'Ringing…' : status === 'ended' ? 'Call ended' : isSleep ? 'Sleeping together 🌙' : 'On a call'}
          </div>
        </div>
      )}

      {isVideo && (
        <div className="call-video-status">
          {status === 'outgoing' ? `Ringing ${who}…` : status === 'ended' ? 'Call ended' : who}
        </div>
      )}

      {error && <div className="call-error">{error}</div>}

      <div className="call-controls">
        <button type="button" className={`call-ctl ${muted ? 'on' : ''}`} onClick={toggleMute}>
          {muted ? '🔇' : '🎙️'}
        </button>
        {isVideo && (
          <button type="button" className={`call-ctl ${cameraOff ? 'on' : ''}`} onClick={toggleCamera}>
            {cameraOff ? '📵' : '📷'}
          </button>
        )}
        <button type="button" className="call-ctl call-hangup" onClick={() => void hangUp()}>
          📞
        </button>
      </div>
    </div>
  )
}
