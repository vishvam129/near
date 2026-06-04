import { useState, type FormEvent } from 'react'
import { useCouple } from '../couple/CoupleProvider'
import { useI18n } from '../lib/i18n'

export function SavingsGoal() {
  const { couple, setSavingsGoal, addToSavings } = useCouple()
  const { money } = useI18n()
  const s = couple?.savings
  const [editing, setEditing] = useState(false)
  const [target, setTarget] = useState(String(s?.target ?? ''))
  const [label, setLabel] = useState(s?.label ?? '')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pct = s && s.target > 0 ? Math.min(100, Math.round((s.saved / s.target) * 100)) : 0

  async function saveGoal(e: FormEvent) {
    e.preventDefault()
    const t = Number(target)
    if (!t || t <= 0) return
    setBusy(true)
    try {
      await setSavingsGoal(t, label.trim() || 'Our next visit')
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  async function contribute(e: FormEvent) {
    e.preventDefault()
    const a = Number(amount)
    if (!a || a <= 0) return
    setBusy(true)
    setError(null)
    try {
      await addToSavings(a)
      setAmount('')
    } catch (err) {
      const code = (err as { code?: string })?.code ?? ''
      setError(
        code === 'permission-denied'
          ? 'Publish web/firestore.rules in your Firebase console, then try again.'
          : ((err as Error)?.message ?? 'Could not add. Try again.'),
      )
    } finally {
      setBusy(false)
    }
  }

  if (!s || editing) {
    return (
      <div className="card savings">
        <h3 className="card-h muted-h">Savings goal</h3>
        <form className="form" onSubmit={saveGoal}>
          <input
            className="input"
            type="text"
            placeholder="What are you saving for? (e.g. flights to NYC)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            className="input"
            type="number"
            inputMode="numeric"
            placeholder="Target amount"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <div className="row-actions">
            <button className="btn" type="submit" disabled={busy || !Number(target)}>
              {busy ? 'Saving…' : 'Set goal'}
            </button>
            {s && (
              <button type="button" className="link" onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="card savings">
      <h3 className="card-h muted-h">Savings goal</h3>
      <div className="savings-label">✈️ {s.label}</div>
      <div className="savings-amounts">
        <strong>{money(s.saved)}</strong> of {money(s.target)} ({pct}%)
      </div>
      <div className="savings-bar">
        <i style={{ width: `${pct}%` }} />
      </div>
      <form className="form entry-form savings-add" onSubmit={contribute}>
        <input
          className="input"
          type="number"
          inputMode="numeric"
          placeholder="Add to the pot…"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button className="btn" type="submit" disabled={busy || !Number(amount)}>
          Add
        </button>
      </form>
      {error && <div className="err">{error}</div>}
      <button
        type="button"
        className="link"
        onClick={() => {
          setTarget(String(s.target))
          setLabel(s.label)
          setEditing(true)
        }}
      >
        Edit goal
      </button>
    </div>
  )
}
