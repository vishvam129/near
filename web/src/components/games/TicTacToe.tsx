import { useAuth } from '../../auth/AuthProvider'
import { useCouple } from '../../couple/CoupleProvider'

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

function winnerOf(cells: string): string | null {
  for (const [a, b, c] of LINES) {
    if (cells[a] !== ' ' && cells[a] === cells[b] && cells[b] === cells[c]) return cells[a]
  }
  return cells.includes(' ') ? null : 'draw'
}

export function TicTacToe() {
  const { user } = useAuth()
  const { couple, partner, newTtt, playTtt } = useCouple()
  const t = couple?.ttt
  const winner = t ? winnerOf(t.cells) : null
  const myMark = t ? (user?.uid === t.x ? 'X' : 'O') : null
  const myTurn = Boolean(t && t.turn === user?.uid && !winner)
  const partnerName = partner?.name || 'your partner'

  let status = ''
  if (t) {
    if (winner === 'draw') status = 'It’s a draw 🤝'
    else if (winner) status = winner === myMark ? 'You won! 🎉' : `${partnerName} won 😄`
    else status = myTurn ? 'Your turn' : `${partnerName}’s turn`
  }

  return (
    <div className="card game-card">
      <h3 className="card-h muted-h">Tic-tac-toe</h3>
      {!t ? (
        <>
          <p className="entry-empty">Start a game — you’re X and go first.</p>
          <button type="button" className="btn" onClick={() => void newTtt()}>
            Start game
          </button>
        </>
      ) : (
        <>
          <div className="ttt-status">
            {status} {myMark && <span className="ttt-mark">(you’re {myMark})</span>}
          </div>
          <div className="ttt-board">
            {t.cells.split('').map((c, i) => (
              <button
                key={i}
                type="button"
                className={`ttt-cell ${c !== ' ' ? 'filled' : ''}`}
                disabled={!myTurn || c !== ' '}
                onClick={() => void playTtt(i)}
              >
                {c.trim()}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => void newTtt()}>
            New game
          </button>
        </>
      )}
    </div>
  )
}
