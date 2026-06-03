import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'
import { toDateInput, prettyDate } from '../lib/format'

// Gentle, non-clinical phase labels derived only from cycle day.
function phaseFor(day: number, length: number): { emoji: string; label: string } {
  if (day <= 5) return { emoji: '🌙', label: 'Period — be extra gentle' }
  const ovu = Math.round(length / 2)
  if (day < ovu - 1) return { emoji: '🌱', label: 'Rising energy' }
  if (day <= ovu + 1) return { emoji: '☀️', label: 'Peak — feeling good' }
  if (day >= length - 4) return { emoji: '🍂', label: 'PMS window — a little patience helps' }
  return { emoji: '🌤️', label: 'Winding down' }
}

function dayOfCycle(start: string, length: number): { day: number; nextStart: Date } {
  const startMs = new Date(start + 'T00:00:00Z').getTime()
  const today = new Date(toDateInput(new Date()) + 'T00:00:00Z').getTime()
  const elapsed = Math.floor((today - startMs) / 86400000)
  const inCycle = ((elapsed % length) + length) % length
  const day = inCycle + 1
  const nextStart = new Date(today + (length - inCycle) * 86400000)
  return { day, nextStart }
}

export function CycleAwareness() {
  const { user } = useAuth()
  const { couple, partner, paired, setCycle } = useCouple()
  const [editing, setEditing] = useState(false)
  const [start, setStart] = useState(toDateInput(new Date()))
  const [length, setLength] = useState('28')

  if (!paired) return null

  const mine = user ? couple?.cycle?.[user.uid] : undefined
  const theirs = partner ? couple?.cycle?.[partner.uid] : undefined

  async function save() {
    const len = Number(length)
    if (!start || !len || len < 15 || len > 60) return
    await setCycle({ start, length: len })
    setEditing(false)
  }

  return (
    <div className="card cycle-card">
      <h3 className="card-h muted-h">Cycle awareness</h3>
      <p className="entry-empty">Private &amp; opt-in. Only a gentle phase is shared — no details.</p>

      {/* Partner's shared phase (if they opted in) */}
      {theirs && (
        <div className="cycle-partner">
          {(() => {
            const { day, nextStart } = dayOfCycle(theirs.start, theirs.length)
            const ph = phaseFor(day, theirs.length)
            return (
              <>
                <div className="cycle-phase">
                  {ph.emoji} {partner?.name || 'Partner'}: {ph.label}
                </div>
                <div className="cycle-sub">
                  Day {day} · next around {prettyDate(toDateInput(nextStart))}
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* My own tracking */}
      {editing ? (
        <div className="cycle-form">
          <label className="repair-label">Last period started</label>
          <input
            className="input"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <label className="repair-label">Cycle length (days)</label>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            value={length}
            onChange={(e) => setLength(e.target.value)}
          />
          <div className="row-actions">
            <button type="button" className="btn" onClick={() => void save()}>
              Save &amp; share phase
            </button>
            <button type="button" className="link" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : mine ? (
        <div className="cycle-mine">
          {(() => {
            const { day } = dayOfCycle(mine.start, mine.length)
            const ph = phaseFor(day, mine.length)
            return (
              <div className="cycle-phase">
                You: {ph.emoji} {ph.label} (day {day})
              </div>
            )
          })()}
          <div className="row-actions">
            <button type="button" className="link" onClick={() => setEditing(true)}>
              Update
            </button>
            <button type="button" className="link" onClick={() => void setCycle(null)}>
              Stop sharing
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)}>
          Track mine (opt-in)
        </button>
      )}
    </div>
  )
}
