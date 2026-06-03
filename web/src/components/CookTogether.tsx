import { useEffect, useState } from 'react'
import { useCouple } from '../couple/CoupleProvider'
import { RECIPES } from '../lib/recipes'

export function CookTogether() {
  const { couple, setRecipe, setCookTimer } = useCouple()
  const recipe = RECIPES.find((r) => r.id === couple?.recipe)
  const [, tick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const endsAt = couple?.cookEndsAt ?? null
  const remaining = endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : null

  return (
    <div className="card cook">
      <h3 className="card-h muted-h">Cook together</h3>
      {!recipe ? (
        <>
          <p className="entry-empty">Pick a recipe — you’ll both follow the same steps.</p>
          <div className="recipe-grid">
            {RECIPES.map((r) => (
              <button
                key={r.id}
                type="button"
                className="recipe-pick"
                onClick={() => void setRecipe(r.id)}
              >
                <span className="recipe-emoji">{r.emoji}</span>
                {r.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="recipe-title">
            {recipe.emoji} {recipe.name}
          </div>
          <div className="recipe-section">Ingredients</div>
          <ul className="recipe-list">
            {recipe.ingredients.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
          <div className="recipe-section">Steps</div>
          <ol className="recipe-list">
            {recipe.steps.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ol>

          <div className="cook-timer">
            {remaining !== null && remaining > 0 ? (
              <div className="cook-countdown">
                ⏱ {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
                <button type="button" className="link" onClick={() => void setCookTimer(null)}>
                  stop
                </button>
              </div>
            ) : remaining === 0 ? (
              <div className="cook-countdown done">
                ⏰ Time’s up!
                <button type="button" className="link" onClick={() => void setCookTimer(null)}>
                  clear
                </button>
              </div>
            ) : (
              <div className="cook-timer-set">
                <span className="recipe-section">Shared timer:</span>
                {[5, 10, 15].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="btn btn-ghost cook-min"
                    onClick={() => void setCookTimer(Date.now() + m * 60_000)}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="link"
            onClick={() => {
              void setRecipe(null)
              void setCookTimer(null)
            }}
          >
            Pick another
          </button>
        </>
      )}
    </div>
  )
}
