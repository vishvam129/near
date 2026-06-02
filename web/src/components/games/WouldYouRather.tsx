import { useAuth } from '../../auth/AuthProvider'
import { useCouple } from '../../couple/CoupleProvider'
import { WYR } from '../../lib/games'

export function WouldYouRather() {
  const { user } = useAuth()
  const { couple, partner, newWyr, pickWyr } = useCouple()
  const wyr = couple?.wyr
  const q = wyr ? WYR[wyr.idx % WYR.length] : null
  const myPick = user ? wyr?.picks?.[user.uid] : undefined
  const theirPick = partner ? wyr?.picks?.[partner.uid] : undefined
  const bothPicked = Boolean(myPick && theirPick)
  const partnerName = partner?.name || 'your partner'

  function start() {
    void newWyr(Math.floor(Math.random() * WYR.length))
  }

  return (
    <div className="card game-card">
      <h3 className="card-h muted-h">Would you rather</h3>
      {!q ? (
        <>
          <p className="entry-empty">Start a round — you both pick, then see if you match.</p>
          <button type="button" className="btn" onClick={start}>
            Start a round
          </button>
        </>
      ) : (
        <>
          <div className="wyr-options">
            {(['a', 'b'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                className={`wyr-opt ${myPick === opt ? 'sel' : ''} ${
                  bothPicked && theirPick === opt ? 'theirs' : ''
                }`}
                disabled={Boolean(myPick)}
                onClick={() => void pickWyr(opt)}
              >
                {q[opt]}
                {bothPicked && theirPick === opt && <span className="wyr-tag">{partnerName}</span>}
                {myPick === opt && <span className="wyr-tag you">you</span>}
              </button>
            ))}
          </div>

          {!myPick && <p className="wyr-hint">Pick one ↑</p>}
          {myPick && !theirPick && <p className="wyr-hint">Waiting for {partnerName}…</p>}
          {bothPicked && (
            <p className="wyr-result">
              {myPick === theirPick ? 'You matched! 💞' : 'You picked differently 😄'}
            </p>
          )}

          <button type="button" className="btn btn-ghost" onClick={start}>
            Next question
          </button>
        </>
      )}
    </div>
  )
}
