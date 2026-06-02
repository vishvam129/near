import { useState } from 'react'
import { TRUTHS, DARES } from '../../lib/games'

export function TruthOrDare() {
  const [spicy, setSpicy] = useState(false)
  const [prompt, setPrompt] = useState<{ kind: 'Truth' | 'Dare'; text: string } | null>(null)

  function pick(kind: 'Truth' | 'Dare') {
    const pool = kind === 'Truth' ? TRUTHS : DARES
    const arr = spicy ? pool.spicy : pool.clean
    setPrompt({ kind, text: arr[Math.floor(Math.random() * arr.length)] })
  }

  return (
    <div className="card game-card">
      <h3 className="card-h muted-h">Truth or Dare</h3>
      <label className="spicy-toggle">
        <input type="checkbox" checked={spicy} onChange={(e) => setSpicy(e.target.checked)} />
        Spicy 🌶️
      </label>

      {prompt && (
        <div className="td-prompt">
          <span className="td-kind">{prompt.kind}</span>
          {prompt.text}
        </div>
      )}

      <div className="row-actions">
        <button type="button" className="btn" onClick={() => pick('Truth')}>
          Truth
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => pick('Dare')}>
          Dare
        </button>
      </div>
    </div>
  )
}
