import { useMemo, useState } from 'react'
import { useCouple } from '../couple/CoupleProvider'
import { IDEAS, type Budget, type Energy, type IdeaType } from '../lib/ideas'

function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

export function IdeaSuggestions() {
  const { paired } = useCouple()
  const [type, setType] = useState<IdeaType>('date')
  const [budget, setBudget] = useState<Budget | 'any'>('any')
  const [energy, setEnergy] = useState<Energy | 'any'>('any')
  const [roll, setRoll] = useState(0)

  const matches = useMemo(() => {
    void roll // re-sample when the user taps "More ideas"
    const pool = IDEAS.filter(
      (i) =>
        i.type === type &&
        (budget === 'any' || i.budget === budget) &&
        (energy === 'any' || i.energy === energy),
    )
    return sample(pool, 3)
  }, [type, budget, energy, roll])

  if (!paired) return null

  return (
    <div className="card idea-card">
      <h3 className="card-h muted-h">Date &amp; gift ideas</h3>

      <div className="idea-filters">
        <div className="idea-seg">
          {(['date', 'gift'] as IdeaType[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${type === t ? 'chip-on' : ''}`}
              onClick={() => setType(t)}
            >
              {t === 'date' ? 'Date' : 'Gift'}
            </button>
          ))}
        </div>
        <div className="idea-seg">
          {(['any', 'free', 'cheap', 'splurge'] as const).map((b) => (
            <button
              key={b}
              type="button"
              className={`chip ${budget === b ? 'chip-on' : ''}`}
              onClick={() => setBudget(b)}
            >
              {b === 'any' ? 'Any £' : b}
            </button>
          ))}
        </div>
        <div className="idea-seg">
          {(['any', 'chill', 'active'] as const).map((e) => (
            <button
              key={e}
              type="button"
              className={`chip ${energy === e ? 'chip-on' : ''}`}
              onClick={() => setEnergy(e)}
            >
              {e === 'any' ? 'Any vibe' : e}
            </button>
          ))}
        </div>
      </div>

      {matches.length === 0 ? (
        <p className="entry-empty">No ideas match that combo — loosen a filter.</p>
      ) : (
        <div className="idea-list">
          {matches.map((i) => (
            <div key={i.text} className="idea-item">
              {i.type === 'date' ? '💡' : '🎁'} {i.text}
            </div>
          ))}
        </div>
      )}

      <button type="button" className="btn" onClick={() => setRoll((r) => r + 1)}>
        More ideas
      </button>
    </div>
  )
}
