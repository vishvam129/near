import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { useMessages, type Message, type ReplyRef } from '../messages/useMessages'
import { useCouple } from '../couple/CoupleProvider'
import { useCall } from '../calls/CallProvider'
import { fileToMessageImage } from '../lib/image'
import { cloudinaryEnabled, uploadVideo } from '../lib/cloudinary'
import { VideoRecorder } from '../components/VideoRecorder'
import { dayLabel, sameDay, timeAgo } from '../lib/format'
import { EmojiPicker } from '../components/EmojiPicker'
import { MessageRow } from '../components/MessageRow'
import { DoodleCanvas } from '../components/DoodleCanvas'

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

function previewText(m: Message): string {
  if (m.imageUrl && !m.text) return '📷 Photo'
  if (m.imageUrl) return `📷 ${m.text}`
  if (m.videoUrl) return '🎥 Video'
  if (m.audioUrl) return '🎤 Voice message'
  return m.text
}

export default function Chat() {
  const { messages, loading, send, sendImage, sendAudio, sendVideo, setReaction, deleteMessage, myUid } =
    useMessages()
  const { partner, couple, setTyping, markRead } = useCouple()
  const { startCall, status: callStatus } = useCall()
  const [text, setText] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [reactingId, setReactingId] = useState<string | null>(null)
  const [fullPickerId, setFullPickerId] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<ReplyRef | null>(null)
  const [doodle, setDoodle] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)

  async function onSendVideo(blob: Blob) {
    const url = await uploadVideo(blob)
    await sendVideo(url, replyTo)
    setReplyTo(null)
  }
  const [recording, setRecording] = useState(false)
  const [recSec, setRecSec] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const typingActive = useRef(false)
  const typingTimer = useRef<number | undefined>(undefined)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const recTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  // Mark the conversation read whenever it changes while the chat is open.
  useEffect(() => {
    void markRead()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length])

  // Clear the typing flag when leaving the chat.
  useEffect(() => {
    return () => {
      if (typingTimer.current) window.clearTimeout(typingTimer.current)
      void setTyping(false)
      if (recTimer.current) window.clearInterval(recTimer.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-evaluate the partner's online/last-seen status periodically.
  const [, forcePresence] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => forcePresence((n) => n + 1), 20_000)
    return () => window.clearInterval(id)
  }, [])

  function onType(e: ChangeEvent<HTMLInputElement>) {
    setText(e.target.value)
    if (!typingActive.current) {
      typingActive.current = true
      void setTyping(true)
    }
    if (typingTimer.current) window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => {
      typingActive.current = false
      void setTyping(false)
    }, 2500)
  }

  function stopTyping() {
    if (typingTimer.current) window.clearTimeout(typingTimer.current)
    typingActive.current = false
    void setTyping(false)
  }

  // Dismiss the reaction bar when tapping anywhere outside it.
  useEffect(() => {
    if (!reactingId) return
    function onDocDown(e: PointerEvent) {
      const t = e.target as HTMLElement | null
      if (t?.closest?.('.react-bar')) return // keep open when tapping a reaction/＋
      setReactingId(null)
    }
    document.addEventListener('pointerdown', onDocDown)
    return () => document.removeEventListener('pointerdown', onDocDown)
  }, [reactingId])

  const partnerName = partner?.name || partner?.email || 'them'

  function whoLabel(from: string): string {
    return from === myUid ? 'You' : partnerName
  }

  function startReply(m: Message) {
    setReplyTo({ id: m.id, text: previewText(m), from: m.from })
    setReactingId(null)
    inputRef.current?.focus()
  }

  function quickLike(m: Message) {
    const mine = myUid ? m.reactions[myUid] : undefined
    void setReaction(m.id, mine === '❤️' ? null : '❤️')
  }

  function unsend(m: Message) {
    setReactingId(null)
    if (window.confirm('Unsend this message? It will be removed for both of you.')) {
      void deleteMessage(m.id)
    }
  }

  function permissionHint(error: unknown): string {
    const code = (error as { code?: string })?.code ?? ''
    if (code === 'permission-denied') {
      return 'Can’t send — publish web/firestore.rules in your Firebase console.'
    }
    return (error as Error)?.message ?? 'Could not send. Try again.'
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    const r = replyTo
    setText('')
    setReplyTo(null)
    setErr(null)
    stopTyping()
    try {
      await send(t, r)
    } catch (error) {
      console.error('send failed:', error)
      setText(t)
      setReplyTo(r)
      setErr(permissionHint(error))
    }
  }

  async function onPickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const r = replyTo
    setReplyTo(null)
    setErr(null)
    setUploading(true)
    try {
      const dataUrl = await fileToMessageImage(file)
      await sendImage(dataUrl, '', r)
    } catch (error) {
      console.error('photo send failed:', error)
      setErr(permissionHint(error))
    } finally {
      setUploading(false)
    }
  }

  function cleanupStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  async function startRec() {
    if (recording || recRef.current) return // guard against double-start
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = (ev) => {
        if (ev.data.size) chunksRef.current.push(ev.data)
      }
      rec.onstop = async () => {
        cleanupStream()
        recRef.current = null
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        const url = await blobToDataURL(blob)
        if (url.length > 900_000) {
          setErr('Voice note too long — keep it under ~45s.')
          return
        }
        try {
          await sendAudio(url)
        } catch (error) {
          setErr(permissionHint(error))
        }
      }
      recRef.current = rec
      rec.start()
      setRecording(true)
      setRecSec(0)
      setErr(null)
      const startedAt = Date.now()
      recTimer.current = window.setInterval(() => {
        const sec = Math.floor((Date.now() - startedAt) / 1000)
        setRecSec(sec)
        if (sec >= 60) stopRec()
      }, 500)
    } catch {
      setErr('Microphone access was blocked.')
    }
  }

  function stopRec() {
    if (recTimer.current) window.clearInterval(recTimer.current)
    setRecording(false)
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
  }

  function cancelRec() {
    if (recTimer.current) window.clearInterval(recTimer.current)
    setRecording(false)
    if (recRef.current) recRef.current.onstop = null
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    recRef.current = null
    cleanupStream()
    chunksRef.current = []
  }

  async function sendDoodle(dataUrl: string) {
    setDoodle(false)
    try {
      await sendImage(dataUrl)
    } catch (error) {
      setErr(permissionHint(error))
    }
  }

  const partnerUid = partner?.uid ?? null
  const partnerTyping = partnerUid ? Boolean(couple?.typing?.[partnerUid]) : false
  const online = partner?.lastActive ? Date.now() - partner.lastActive.getTime() < 75_000 : false
  const presence = online
    ? 'online'
    : partner?.lastActive
      ? `last seen ${timeAgo(partner.lastActive)}`
      : ''
  const lastMsg = messages[messages.length - 1]
  const partnerLastRead = partnerUid ? (couple?.lastRead?.[partnerUid] ?? null) : null
  const lastIsMine = !!lastMsg && lastMsg.from === myUid
  const lastSeen =
    lastIsMine &&
    !!lastMsg.sentAt &&
    !!partnerLastRead &&
    partnerLastRead.getTime() >= lastMsg.sentAt.getTime()
  const statusText = !lastIsMine
    ? ''
    : lastSeen
      ? 'Seen'
      : lastMsg.pending
        ? 'Sending…'
        : 'Sent'

  return (
    <div className="chat-screen">
      <header className="chat-header">
        <div className="chat-header-info">
          <span className="chat-title">{partner?.name || partner?.email || 'Chat'}</span>
          {presence && (
            <span className={`chat-presence ${online ? 'is-online' : ''}`}>
              {online && <span className="online-dot" />}
              {presence}
            </span>
          )}
        </div>
        <div className="chat-call-btns">
          <button
            type="button"
            className="chat-call-btn"
            aria-label="Voice call"
            disabled={!partner || callStatus !== 'idle'}
            onClick={() => void startCall('voice')}
          >
            📞
          </button>
          <button
            type="button"
            className="chat-call-btn"
            aria-label="Video call"
            disabled={!partner || callStatus !== 'idle'}
            onClick={() => void startCall('video')}
          >
            📹
          </button>
        </div>
      </header>

      <div className="chat-list">
        {loading ? (
          <div className="chat-empty">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">No messages yet — say hi 👋</div>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1]
            const d = m.sentAt ?? new Date()
            const prevD = prev ? (prev.sentAt ?? new Date()) : null
            const showSep = !prevD || !sameDay(prevD, d)
            return (
              <Fragment key={m.id}>
                {showSep && <div className="day-sep">{dayLabel(d)}</div>}
                <MessageRow
                  m={m}
                  mine={m.from === myUid}
                  myUid={myUid}
                  whoLabel={whoLabel}
                  reacting={reactingId === m.id}
                  onReply={startReply}
                  onToggleReactBar={(msg) => setReactingId(reactingId === msg.id ? null : msg.id)}
                  onQuickLike={quickLike}
                  onOpenImage={setLightbox}
                  onPickReaction={(msg, emoji) => {
                    void setReaction(msg.id, emoji)
                    setReactingId(null)
                  }}
                  onMore={(msg) => {
                    setFullPickerId(msg.id)
                    setReactingId(null)
                  }}
                  onUnsend={unsend}
                />
              </Fragment>
            )
          })
        )}

        {!loading && lastIsMine && <div className="seen-status">{statusText}</div>}

        {partnerTyping && (
          <div className="typing-row">
            <div className="typing-bubble">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {err && <div className="chat-error">{err}</div>}

      {replyTo && (
        <div className="reply-preview">
          <div className="reply-preview-body">
            <span className="reply-preview-who">
              Replying to {replyTo.from === myUid ? 'yourself' : partnerName}
            </span>
            <span className="reply-preview-text">{replyTo.text}</span>
          </div>
          <button
            type="button"
            className="reply-cancel"
            aria-label="Cancel reply"
            onClick={() => setReplyTo(null)}
          >
            ✕
          </button>
        </div>
      )}

      {recording ? (
        <div className="composer recording-bar">
          <span className="rec-dot" />
          <span className="rec-time">
            Recording… {Math.floor(recSec / 60)}:{String(recSec % 60).padStart(2, '0')}
          </span>
          <button type="button" className="link" onClick={cancelRec}>
            Cancel
          </button>
          <button
            type="button"
            className="composer-send"
            onClick={stopRec}
            aria-label="Send voice note"
          >
            ➤
          </button>
        </div>
      ) : (
        <form className="composer" onSubmit={submit}>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
          <button
            type="button"
            className="composer-photo"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Send a photo"
          >
            {uploading ? '…' : '📷'}
          </button>
          <button
            type="button"
            className="composer-photo"
            onClick={() => setDoodle(true)}
            aria-label="Doodle"
          >
            ✏️
          </button>
          {cloudinaryEnabled && (
            <button
              type="button"
              className="composer-photo"
              onClick={() => setVideoOpen(true)}
              aria-label="Record a video message"
            >
              🎥
            </button>
          )}
          <input
            ref={inputRef}
            className="composer-input"
            type="text"
            placeholder="Message…"
            value={text}
            onChange={onType}
            autoComplete="off"
          />
          {text.trim() ? (
            <button className="composer-send" type="submit" aria-label="Send">
              ➤
            </button>
          ) : (
            <button
              type="button"
              className="composer-send"
              onClick={() => void startRec()}
              aria-label="Record voice note"
            >
              🎤
            </button>
          )}
        </form>
      )}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="full size" />
          <button className="lightbox-close" type="button" aria-label="Close">
            ✕
          </button>
        </div>
      )}

      {fullPickerId && (
        <EmojiPicker
          onPick={(emoji) => {
            void setReaction(fullPickerId, emoji)
            setFullPickerId(null)
          }}
          onClose={() => setFullPickerId(null)}
        />
      )}

      {doodle && <DoodleCanvas onSend={sendDoodle} onClose={() => setDoodle(false)} />}

      {videoOpen && (
        <div className="vid-rec-overlay">
          <VideoRecorder onSend={onSendVideo} onClose={() => setVideoOpen(false)} />
        </div>
      )}
    </div>
  )
}
