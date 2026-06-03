import { useCouple } from '../couple/CoupleProvider'

const SCENES = [
  { id: 'stars', name: 'Starry night', emoji: '✨' },
  { id: 'rain', name: 'Cozy rain', emoji: '🌧️' },
  { id: 'sunset', name: 'Sunset', emoji: '🌅' },
  { id: 'fire', name: 'Fireplace', emoji: '🔥' },
]

export function AmbientScenes() {
  const { couple, setScene } = useCouple()
  const scene = couple?.scene ?? null

  return (
    <div className="card ambient">
      <h3 className="card-h muted-h">Together scene</h3>
      {scene && (
        <div className={`scene scene-${scene}`}>
          <div className="scene-overlay">You’re sharing this 💞</div>
        </div>
      )}
      <div className="scene-grid">
        {SCENES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`scene-pick ${scene === s.id ? 'sel' : ''}`}
            onClick={() => void setScene(scene === s.id ? null : s.id)}
          >
            <span className="scene-emoji">{s.emoji}</span>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )
}
