import { useMemo, useState } from 'react'
import data from '@emoji-mart/data'

type EmojiItem = {
  id: string
  name: string
  keywords?: string[]
  skins: { native: string }[]
}

// Reuse emoji-mart's full dataset, but render our own grid so taps are plain
// React handlers (reliable) instead of going through the emoji-mart web component.
const ALL: EmojiItem[] = Object.values(
  (data as { emojis: Record<string, EmojiItem> }).emojis,
)

/** Full searchable emoji picker in a centered, dismissable card. */
export function EmojiPicker({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return ALL
    return ALL.filter(
      (e) =>
        e.id.includes(query) ||
        e.name.toLowerCase().includes(query) ||
        e.keywords?.some((k) => k.includes(query)),
    )
  }, [q])

  return (
    <div className="emoji-overlay" onClick={onClose}>
      <div className="emoji-pop" onClick={(e) => e.stopPropagation()}>
        <div className="emoji-head">
          <input
            className="emoji-search"
            type="text"
            placeholder="Search emoji"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="button" className="emoji-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="emoji-grid">
          {list.map((e) => (
            <button
              key={e.id}
              type="button"
              className="emoji-cell"
              title={e.name}
              onClick={() => onPick(e.skins[0].native)}
            >
              {e.skins[0].native}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
