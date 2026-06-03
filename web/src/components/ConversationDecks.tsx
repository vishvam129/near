import { useState } from 'react'
import { useCouple } from '../couple/CoupleProvider'
import { DECKS } from '../lib/growth'

export function ConversationDecks() {
  const { paired } = useCouple()
  const [deckId, setDeckId] = useState<string | null>(null)
  const [card, setCard] = useState<string | null>(null)
  const [seen, setSeen] = useState<number[]>([])

  if (!paired) return null

  const deck = DECKS.find((d) => d.id === deckId)

  function draw(d: { cards: string[] }) {
    // Avoid repeats until the deck is exhausted, then reshuffle.
    let pool = d.cards.map((_, i) => i).filter((i) => !seen.includes(i))
    let nextSeen = seen
    if (pool.length === 0) {
      // Reshuffle, but exclude the card just shown so it can't repeat across
      // the boundary (guard the degenerate 1-card deck).
      const last = seen[seen.length - 1]
      pool = d.cards.map((_, i) => i).filter((i) => i !== last)
      if (pool.length === 0) pool = d.cards.map((_, i) => i)
      nextSeen = []
    }
    const pick = pool[Math.floor(Math.random() * pool.length)]
    setSeen([...nextSeen, pick])
    setCard(d.cards[pick])
  }

  if (deck) {
    return (
      <div className="card deck-card">
        <h3 className="card-h muted-h">
          {deck.emoji} {deck.title}
        </h3>
        <div className="deck-card-face">{card ? `“${card}”` : 'Tap “Draw a card” to begin.'}</div>
        <div className="row-actions">
          <button type="button" className="btn" onClick={() => draw(deck)}>
            Draw a card
          </button>
          <button
            type="button"
            className="link"
            onClick={() => {
              setDeckId(null)
              setCard(null)
              setSeen([])
            }}
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="card-h muted-h">Conversation decks</h3>
      <p className="entry-empty">Pick a deck and draw a card to spark a real talk.</p>
      <div className="deck-grid">
        {DECKS.map((d) => (
          <button
            key={d.id}
            type="button"
            className="deck-pick"
            onClick={() => {
              setDeckId(d.id)
              setCard(null)
              setSeen([])
            }}
          >
            <span className="deck-emoji">{d.emoji}</span>
            {d.title}
          </button>
        ))}
      </div>
    </div>
  )
}
