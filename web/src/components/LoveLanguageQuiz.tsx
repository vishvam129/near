import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'

type Lang = 'words' | 'time' | 'acts' | 'touch' | 'gifts'

const LANGS: Record<Lang, { label: string; emoji: string; nudge: string }> = {
  words: {
    label: 'Words of Affirmation',
    emoji: '💬',
    nudge: 'Send them a heartfelt text or tell them one thing you admire today.',
  },
  time: {
    label: 'Quality Time',
    emoji: '⏳',
    nudge: 'Plan a no-phones call or a watch-together date this week.',
  },
  acts: {
    label: 'Acts of Service',
    emoji: '🤝',
    nudge: 'Do a small thing for them — order their groceries, handle a chore from afar.',
  },
  touch: {
    label: 'Physical Touch',
    emoji: '🤗',
    nudge: 'Send a kiss or heartbeat now, and save up the longest hug for your next visit.',
  },
  gifts: {
    label: 'Receiving Gifts',
    emoji: '🎁',
    nudge: 'Surprise them with a little something — even a tiny delivery says “I thought of you.”',
  },
}

// Each option adds a point to one love language; the highest total wins.
const QUESTIONS: { q: string; a: [string, Lang]; b: [string, Lang] }[] = [
  { q: 'A perfect long-distance evening is…', a: ['A long call just for us', 'time'], b: ['A sweet good-night message', 'words'] },
  { q: 'You feel most loved when they…', a: ['Send a surprise gift', 'gifts'], b: ['Handle something to make your day easier', 'acts'] },
  { q: 'You miss most…', a: ['Holding hands & hugs', 'touch'], b: ['Undivided time together', 'time'] },
  { q: 'The best text to get is…', a: ['“I’m so proud of you”', 'words'], b: ['“I ordered your favourite for you”', 'acts'] },
  { q: 'A meaningful gesture is…', a: ['A handwritten note in a parcel', 'gifts'], b: ['A long video cuddle session', 'touch'] },
  { q: 'You’d rather they…', a: ['Plan a whole day around you', 'time'], b: ['Compliment you out of the blue', 'words'] },
  { q: 'On a hard day you want…', a: ['Them to fix one annoying thing for you', 'acts'], b: ['A virtual hug and closeness', 'touch'] },
  { q: 'A keepsake you’d treasure…', a: ['Something they picked just for you', 'gifts'], b: ['A playlist of words they wrote you', 'words'] },
]

export function LoveLanguageQuiz() {
  const { user } = useAuth()
  const { couple, partner, paired, setLoveLang } = useCouple()
  const [open, setOpen] = useState(false)
  const [i, setI] = useState(0)
  const [scores, setScores] = useState<Record<Lang, number>>({
    words: 0,
    time: 0,
    acts: 0,
    touch: 0,
    gifts: 0,
  })

  if (!paired) return null

  const mine = (user && couple?.loveLang?.[user.uid]) as Lang | undefined
  const theirs = (partner && couple?.loveLang?.[partner.uid]) as Lang | undefined

  function answer(lang: Lang) {
    const next = { ...scores, [lang]: scores[lang] + 1 }
    if (i + 1 >= QUESTIONS.length) {
      const top = (Object.keys(next) as Lang[]).reduce((a, b) => (next[b] > next[a] ? b : a))
      void setLoveLang(top)
      setOpen(false)
      setI(0)
      setScores({ words: 0, time: 0, acts: 0, touch: 0, gifts: 0 })
    } else {
      setScores(next)
      setI(i + 1)
    }
  }

  if (open) {
    const q = QUESTIONS[i]
    return (
      <div className="card">
        <h3 className="card-h muted-h">
          Love language · {i + 1}/{QUESTIONS.length}
        </h3>
        <p className="ll-q">{q.q}</p>
        <div className="ll-opts">
          <button type="button" className="btn btn-ghost ll-opt" onClick={() => answer(q.a[1])}>
            {q.a[0]}
          </button>
          <button type="button" className="btn btn-ghost ll-opt" onClick={() => answer(q.b[1])}>
            {q.b[0]}
          </button>
        </div>
        <button type="button" className="link" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="card-h muted-h">Love languages</h3>

      <div className="ll-results">
        <div className="ll-person">
          <span className="ll-name">You</span>
          {mine ? (
            <span className="ll-badge">
              {LANGS[mine].emoji} {LANGS[mine].label}
            </span>
          ) : (
            <span className="ll-badge muted">Take the quiz</span>
          )}
        </div>
        <div className="ll-person">
          <span className="ll-name">{partner?.name || 'Partner'}</span>
          {theirs ? (
            <span className="ll-badge">
              {LANGS[theirs].emoji} {LANGS[theirs].label}
            </span>
          ) : (
            <span className="ll-badge muted">Not taken yet</span>
          )}
        </div>
      </div>

      {theirs && (
        <p className="ll-nudge">💡 To love {partner?.name || 'them'} their way: {LANGS[theirs].nudge}</p>
      )}

      <button type="button" className="btn" onClick={() => setOpen(true)}>
        {mine ? 'Retake quiz' : 'Take the quiz'}
      </button>
    </div>
  )
}
