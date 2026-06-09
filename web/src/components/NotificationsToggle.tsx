import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'
import { enablePush, disablePush, pushSupported, type PushResult } from '../lib/push'

const TOKEN_KEY = 'near_push_token'

export function NotificationsToggle() {
  const { user } = useAuth()
  const { paired } = useCouple()
  const [supported, setSupported] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    pushSupported().then(setSupported)
  }, [])

  if (!paired) return null

  function explain(r: Exclude<PushResult, { ok: true }>): string {
    switch (r.reason) {
      case 'unsupported':
        return 'This browser can’t do push notifications. Try Chrome, or install the app to your home screen first.'
      case 'no-vapid':
        return 'Push key isn’t configured yet.'
      case 'denied':
        return 'Notifications were blocked. Enable them for this site in your browser settings, then try again.'
      default:
        return r.detail || 'Something went wrong enabling notifications.'
    }
  }

  async function turnOn() {
    if (!user) return
    setBusy(true)
    setMsg(null)
    const r = await enablePush(user.uid)
    if (r.ok) {
      localStorage.setItem(TOKEN_KEY, r.token)
      setToken(r.token)
      setMsg('Notifications are on for this device 🔔')
    } else {
      setMsg(explain(r))
    }
    setBusy(false)
  }

  async function turnOff() {
    if (!user || !token) return
    setBusy(true)
    await disablePush(user.uid, token)
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setMsg('Notifications turned off for this device.')
    setBusy(false)
  }

  return (
    <div className="card">
      <h3 className="card-h muted-h">Notifications 🔔</h3>
      <p className="entry-empty">
        Get a ping when your partner messages, pokes or sends a photo — even when the app is closed.
      </p>
      {supported === false ? (
        <p className="err">
          This browser doesn’t support push. On Android, install Near to your home screen (Chrome → ⋮
          → Add to Home screen) and open it from there.
        </p>
      ) : token ? (
        <button type="button" className="btn btn-ghost" onClick={turnOff} disabled={busy}>
          {busy ? '…' : 'Turn off on this device'}
        </button>
      ) : (
        <button type="button" className="btn" onClick={turnOn} disabled={busy || supported === null}>
          {busy ? 'Enabling…' : 'Enable notifications'}
        </button>
      )}
      {msg && <div className="push-msg">{msg}</div>}
    </div>
  )
}
