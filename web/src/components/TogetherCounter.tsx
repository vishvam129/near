import { useState, type FormEvent } from 'react'
import { useCouple } from '../couple/CoupleProvider'
import { durationSince, formatDuration, toDateInput } from '../lib/format'

export function TogetherCounter() {
  const { couple, updateSince } = useCouple()
  const [editing, setEditing] = useState(false)

  // Use the explicit "together since" date, else fall back to when the couple
  // was created in the app.
  const sinceStr =
    couple?.sinceDate ?? (couple?.createdAt ? toDateInput(couple.createdAt) : null)

  if (editing) {
    return (
      <SinceForm
        initial={couple?.sinceDate ?? (sinceStr ?? '')}
        onDone={() => setEditing(false)}
        onSave={updateSince}
      />
    )
  }

  if (!sinceStr) return null
  const d = durationSince(sinceStr)
  if (!d) return null

  return (
    <div className="together">
      <span>
        💞 Together for <strong>{formatDuration(d)}</strong>
      </span>
      <button className="link" type="button" onClick={() => setEditing(true)}>
        edit
      </button>
    </div>
  )
}

function SinceForm({
  initial,
  onDone,
  onSave,
}: {
  initial: string
  onDone: () => void
  onSave: (date: string | null) => Promise<void>
}) {
  const [date, setDate] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!date) {
      setErr('Pick the date you got together.')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      await onSave(date)
      onDone()
    } catch (e2) {
      setErr((e2 as Error)?.message ?? 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="together-form">
      <form className="form" onSubmit={save}>
        <label className="field">
          <span className="field-label">Together since</span>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        {err && <div className="err">{err}</div>}
        <div className="row-actions">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="link" onClick={onDone} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
