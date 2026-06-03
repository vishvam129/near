import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMessages } from '../messages/useMessages'

// A compact chat under the video — reuses the main chat thread so messages
// show in both places.
export function WatchChat() {
  const { messages, send, myUid } = useMessages()
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const recent = messages.filter((m) => m.text).slice(-25)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [recent.length])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    setText('')
    try {
      await send(t)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="watch-chat">
      <div className="watch-chat-list">
        {recent.length === 0 ? (
          <div className="entry-empty">Chat here while you watch together.</div>
        ) : (
          recent.map((m) => (
            <div key={m.id} className={`wc-msg ${m.from === myUid ? 'me' : ''}`}>
              {m.text}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
      <form className="watch-chat-form" onSubmit={submit}>
        <input
          className="input"
          type="text"
          placeholder="Say something…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="composer-send" type="submit" aria-label="Send">
          ➤
        </button>
      </form>
    </div>
  )
}
