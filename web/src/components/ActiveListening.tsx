import { useState } from 'react'
import { useCouple } from '../couple/CoupleProvider'

// Speaker prompts — one partner shares, the other only listens & reflects back.
const PROMPTS = [
  'Something on my mind this week is…',
  'A moment I felt really close to you was…',
  'Something I’ve been worried about is…',
  'One thing I need more of right now is…',
  'I felt proud of myself recently when…',
  'Something I’ve wanted to tell you but haven’t is…',
  'A small thing you do that means a lot to me is…',
  'Lately I’ve been feeling…',
]

const STEPS = [
  'Speaker shares. Listener: no interrupting, no fixing — just listen.',
  'Listener reflects back: “What I heard you say is…”',
  'Speaker confirms or gently corrects until they feel understood.',
  'Swap roles and pick a new card.',
]

export function ActiveListening() {
  const { paired } = useCouple()
  const [i, setI] = useState(0)
  const [started, setStarted] = useState(false)

  if (!paired) return null

  function next() {
    setI((n) => (n + 1) % PROMPTS.length)
  }

  return (
    <div className="card listen-card">
      <h3 className="card-h muted-h">Active listening</h3>
      {!started ? (
        <>
          <p className="entry-empty">
            A 4-step turn to really hear each other. One speaks, one listens — then swap.
          </p>
          <ol className="listen-steps">
            {STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <button type="button" className="btn" onClick={() => setStarted(true)}>
            Start
          </button>
        </>
      ) : (
        <>
          <div className="listen-prompt">“{PROMPTS[i]}”</div>
          <ol className="listen-steps">
            {STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <div className="row-actions">
            <button type="button" className="btn" onClick={next}>
              New card
            </button>
            <button type="button" className="link" onClick={() => setStarted(false)}>
              Done
            </button>
          </div>
        </>
      )}
    </div>
  )
}
