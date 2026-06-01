import { useEffect, useState, type FormEvent } from 'react'
import { useCouple, type Meetup } from '../couple/CoupleProvider'
import { countdownTo, prettyDate } from '../lib/format'

export function Countdown() {
  const { couple } = useCouple()
  const [editing, setEditing] = useState(false)
  // re-render each minute so hours/minutes stay current
  const [, force] = useState(0)
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const meetup = couple?.nextMeetup ?? null

  if (editing) return <MeetupForm initial={meetup} onDone={() => setEditing(false)} />

  if (!meetup) {
    return (
      <div className="count-card count-empty">
        <h3 className="card-h">Next time you meet</h3>
        <button className="btn" type="button" onClick={() => setEditing(true)}>
          Set your next visit ✈️
        </button>
      </div>
    )
  }

  const c = countdownTo(meetup.date)
  return (
    <div className="count-card">
      <h3 className="card-h">Next time you meet</h3>
      {c.past ? (
        <div className="count-big small">The day is here! 🎉</div>
      ) : (
        <>
          <div className="count-big">{c.days}</div>
          <div className="count-lbl">
            {c.days === 1 ? 'day' : 'days'} · {c.hours}h {c.minutes}m to go
          </div>
        </>
      )}
      <div className="count-where">
        📍 {meetup.place || 'somewhere together'} · {prettyDate(meetup.date)}
      </div>
      <button className="link" type="button" onClick={() => setEditing(true)}>
        Edit
      </button>
    </div>
  )
}

function MeetupForm({ initial, onDone }: { initial: Meetup | null; onDone: () => void }) {
  const { updateMeetup } = useCouple()
  const [date, setDate] = useState(initial?.date ?? '')
  const [place, setPlace] = useState(initial?.place ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!date) {
      setErr('Pick a date.')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      await updateMeetup({ date, place: place.trim() })
      onDone()
    } catch (e2) {
      setErr((e2 as Error)?.message ?? 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  async function clear() {
    setBusy(true)
    try {
      await updateMeetup(null)
      onDone()
    } catch (e2) {
      setErr((e2 as Error)?.message ?? 'Could not clear.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="count-card">
      <h3 className="card-h">Next visit</h3>
      <form className="form" onSubmit={save}>
        <label className="field">
          <span className="field-label">Date</span>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Place</span>
          <input
            className="input"
            type="text"
            placeholder="e.g. New York"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
          />
        </label>
        {err && <div className="err">{err}</div>}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <div className="row-actions">
          {initial && (
            <button type="button" className="link" onClick={clear} disabled={busy}>
              Clear visit
            </button>
          )}
          <button type="button" className="link" onClick={onDone} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
