import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'
import { useCall } from '../calls/CallProvider'

function fmtTime(at: number): string {
  return new Intl.DateTimeFormat([], { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(at),
  )
}

export function Bedtime() {
  const { user } = useAuth()
  const { couple, partner, setSleeping, setAlarm } = useCouple()
  const { startCall, status: callStatus } = useCall()
  const mySleep = user ? Boolean(couple?.sleeping?.[user.uid]) : false
  const theirSleep = partner ? Boolean(couple?.sleeping?.[partner.uid]) : false
  const alarm = couple?.alarm ?? null
  const [time, setTime] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const partnerName = partner?.name || 'Your partner'

  async function setIt(e: FormEvent) {
    e.preventDefault()
    const at = new Date(time).getTime()
    if (!time || isNaN(at) || at <= Date.now()) {
      setErr('Pick a future time.')
      return
    }
    setErr(null)
    await setAlarm({ at, label: 'Wake up 💞' })
    setTime('')
  }

  return (
    <div className="card bedtime">
      <h3 className="card-h muted-h">Sleep &amp; alarm</h3>
      <button
        type="button"
        className={`btn ${mySleep ? '' : 'btn-ghost'}`}
        onClick={() => void setSleeping(!mySleep)}
      >
        {mySleep ? '😴 Asleep — tap when you wake' : '🌙 I’m going to sleep'}
      </button>
      {theirSleep && (
        <div className="bedtime-partner">{partnerName} is asleep 😴 — sweet dreams</div>
      )}

      <button
        type="button"
        className="btn btn-ghost bedtime-sleepcall"
        disabled={!partner || callStatus !== 'idle'}
        onClick={() => void startCall('sleep')}
      >
        🌙 Sleep call — fall asleep together
      </button>
      <p className="bedtime-hint">A low-light audio call you can leave on overnight.</p>


      <div className="bedtime-alarm">
        {alarm ? (
          <div className="bedtime-alarm-set">
            ⏰ Shared alarm: {fmtTime(alarm.at)}
            <button type="button" className="link" onClick={() => void setAlarm(null)}>
              clear
            </button>
          </div>
        ) : (
          <form className="watch-chat-form" onSubmit={setIt}>
            <input
              className="input"
              type="datetime-local"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <button className="btn bedtime-set-btn" type="submit">
              Set alarm
            </button>
          </form>
        )}
        {err && <div className="err">{err}</div>}
      </div>
    </div>
  )
}
