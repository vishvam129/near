import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Message } from '../messages/useMessages'

const REACTIONS = ['❤️', '😂', '😍', '👍', '😮', '😢']

const SWIPE_TRIGGER = 55 // px to swipe before a reply fires
const SWIPE_MAX = 90
const LONG_PRESS_MS = 420
const DOUBLE_TAP_MS = 300

type Props = {
  m: Message
  mine: boolean
  myUid: string | null
  whoLabel: (from: string) => string
  reacting: boolean
  onReply: (m: Message) => void
  onToggleReactBar: (m: Message) => void
  onQuickLike: (m: Message) => void
  onOpenImage: (url: string) => void
  onPickReaction: (m: Message, emoji: string | null) => void
  onMore: (m: Message) => void
  onUnsend: (m: Message) => void
}

function timeLabel(d: Date | null): string {
  if (!d) return ''
  return new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit' }).format(d)
}

export function MessageRow({
  m,
  mine,
  myUid,
  whoLabel,
  reacting,
  onReply,
  onToggleReactBar,
  onQuickLike,
  onOpenImage,
  onPickReaction,
  onMore,
  onUnsend,
}: Props) {
  const reacts = Object.values(m.reactions)
  const myReaction = myUid ? m.reactions[myUid] : undefined

  const [dx, setDx] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const dxRef = useRef(0)
  const startX = useRef(0)
  const startY = useRef(0)
  const swiping = useRef(false)
  const down = useRef(false)
  const lpTimer = useRef<number | undefined>(undefined)
  const lastTap = useRef(0)

  function clearLp() {
    if (lpTimer.current) window.clearTimeout(lpTimer.current)
    lpTimer.current = undefined
  }

  function onPointerDown(e: ReactPointerEvent) {
    down.current = true
    swiping.current = false
    startX.current = e.clientX
    startY.current = e.clientY
    e.currentTarget.setPointerCapture?.(e.pointerId)
    clearLp()
    lpTimer.current = window.setTimeout(() => {
      if (!swiping.current) onToggleReactBar(m)
    }, LONG_PRESS_MS)
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!down.current) return
    const ddx = e.clientX - startX.current
    const ddy = e.clientY - startY.current
    if (!swiping.current && Math.abs(ddx) > 10 && Math.abs(ddx) > Math.abs(ddy)) {
      swiping.current = true
      setDragActive(true)
      clearLp()
    }
    if (swiping.current) {
      const mag = Math.min(SWIPE_MAX, Math.abs(ddx))
      const v = mine ? -mag : mag // they: swipe right; me: swipe left
      dxRef.current = v
      setDx(v)
    }
  }

  function onPointerUp(e: ReactPointerEvent) {
    down.current = false
    clearLp()
    if (swiping.current) {
      if (Math.abs(dxRef.current) >= SWIPE_TRIGGER) onReply(m)
      dxRef.current = 0
      setDragActive(false)
      setDx(0)
      swiping.current = false
      return
    }
    // a tap: detect double-tap → quick ❤️
    const now = e.timeStamp
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0
      onQuickLike(m)
    } else {
      lastTap.current = now
    }
  }

  return (
    <div className={`msg-row ${mine ? 'mine' : ''}`}>
      <div className="swipe-hint" style={{ opacity: Math.min(1, Math.abs(dx) / SWIPE_TRIGGER) }}>
        ↩
      </div>
      <div
        className="swipe-wrap"
        style={{
          transform: `translateX(${dx}px)`,
          transition: dragActive ? 'none' : 'transform 0.18s ease',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          down.current = false
          swiping.current = false
          clearLp()
          dxRef.current = 0
          setDragActive(false)
          setDx(0)
        }}
      >
        <div className="bubble-line">
          <div className={`bubble ${mine ? 'me' : 'them'} ${m.imageUrl ? 'has-image' : ''}`}>
            {m.replyTo && (
              <div className="reply-quote">
                <span className="reply-quote-who">{whoLabel(m.replyTo.from)}</span>
                <span className="reply-quote-text">{m.replyTo.text}</span>
              </div>
            )}
            {m.imageUrl && (
              <img
                className="bubble-img"
                src={m.imageUrl}
                alt="shared"
                onClick={(ev) => {
                  ev.stopPropagation()
                  onOpenImage(m.imageUrl as string)
                }}
              />
            )}
            {m.text && <span className="bubble-text">{m.text}</span>}
            <span className="bubble-time">{m.pending ? '…' : timeLabel(m.sentAt)}</span>
            {reacts.length > 0 && <div className="reaction-chip">{reacts.join('')}</div>}
          </div>

          <button
            type="button"
            className="reply-trigger"
            aria-label="Reply"
            onClick={() => onReply(m)}
          >
            ↩
          </button>

          {reacting && (
            <div className="react-bar">
              {REACTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={`react-opt ${myReaction === e ? 'on' : ''}`}
                  onClick={() => onPickReaction(m, myReaction === e ? null : e)}
                >
                  {e}
                </button>
              ))}
              <button
                type="button"
                className="react-opt react-more"
                aria-label="More emojis"
                onClick={() => onMore(m)}
              >
                ＋
              </button>
              {mine && (
                <button
                  type="button"
                  className="react-opt react-unsend"
                  aria-label="Unsend"
                  onClick={() => onUnsend(m)}
                >
                  🗑
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
