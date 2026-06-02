import { useState } from 'react'

const IDEAS = [
  'Cook the same recipe over a video call.',
  'Watch a sunset together on the Watch tab.',
  'Play 20 questions until you learn something new.',
  'Have a virtual coffee date — same drink, same time.',
  'Make a shared playlist and listen together.',
  'Do a “draw each other” challenge and reveal at once.',
  'Plan your dream trip on a shared map.',
  'Read the same book and discuss a chapter.',
  'Do a workout together over video.',
  'Write each other a short love letter.',
  'Watch a stand-up special and laugh together.',
  'Take a personality quiz and compare answers.',
  'Order each other a surprise food delivery.',
  'Stargaze together and send each other photos of the sky.',
  'Do a puzzle or play an online game together.',
  'Give each other a virtual tour of your room.',
  'Recreate your first date at home.',
  'Have a themed dinner — pick a country and both cook it.',
  'Make a countdown plan for your next visit.',
  'Share three things you’re grateful for about each other.',
]

export function DateIdeas() {
  const [idea, setIdea] = useState<string | null>(null)

  function surprise() {
    // avoid repeating the current idea
    let next = idea
    while (next === idea && IDEAS.length > 1) {
      next = IDEAS[Math.floor(Math.random() * IDEAS.length)]
    }
    setIdea(next ?? IDEAS[0])
  }

  return (
    <div className="card date-ideas">
      <h3 className="card-h muted-h">Date-night idea</h3>
      {idea ? (
        <div className="idea-text">💡 {idea}</div>
      ) : (
        <p className="entry-empty">Stuck on what to do? Get a suggestion.</p>
      )}
      <button type="button" className="btn" onClick={surprise}>
        {idea ? 'Another idea' : 'Surprise us 💡'}
      </button>
    </div>
  )
}
