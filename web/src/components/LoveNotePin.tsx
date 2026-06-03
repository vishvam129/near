import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'

// A single short note that stays pinned on the partner's Home until they tap
// "Got it" (#21 — the in-app version of a home-screen love-note widget).
export function LoveNotePin() {
  const { user } = useAuth()
  const { couple, partner, paired, setPinnedNote } = useCouple()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  if (!paired) return null

  const note = couple?.pinnedNote ?? null
  const fromMe = note?.from === user?.uid

  async function send() {
    if (!text.trim()) return
    setBusy(true)
    try {
      await setPinnedNote(text.trim().slice(0, 140))
      setText('')
    } finally {
      setBusy(false)
    }
  }

  // A note from the partner — show it big with a dismiss.
  if (note && !fromMe) {
    return (
      <div className="card note-pin note-pin-got">
        <div className="note-pin-from">💌 {partner?.name || 'Your partner'} pinned for you</div>
        <div className="note-pin-text">{note.text}</div>
        <button type="button" className="btn" onClick={() => void setPinnedNote(null)}>
          Got it 💛
        </button>
      </div>
    )
  }

  // My own note still waiting to be seen.
  if (note && fromMe) {
    return (
      <div className="card note-pin">
        <h3 className="card-h muted-h">Love note</h3>
        <div className="note-pin-text">“{note.text}”</div>
        <div className="note-pin-status">📌 Pinned for {partner?.name || 'them'} — waiting</div>
        <button type="button" className="link" onClick={() => void setPinnedNote(null)}>
          Take it down
        </button>
      </div>
    )
  }

  // No note pinned — compose one.
  return (
    <div className="card note-pin">
      <h3 className="card-h muted-h">Love note</h3>
      <p className="entry-empty">Pin a little note to {partner?.name || 'their'} Home screen.</p>
      <input
        className="input"
        type="text"
        maxLength={140}
        placeholder="Thinking of you…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="button" className="btn" onClick={() => void send()} disabled={busy || !text.trim()}>
        Pin it
      </button>
    </div>
  )
}
