import { useState } from 'react'
import { useCouple } from '../couple/CoupleProvider'
import { setRitualTime } from '../lib/ritual'

const DONE_KEY = 'near_onboarded'

export function hasOnboarded(): boolean {
  try {
    return localStorage.getItem(DONE_KEY) === '1'
  } catch {
    return false
  }
}

const TABS = [
  { icon: '🏠', name: 'Home', blurb: 'Your shared dashboard — counter, clocks, moods, daily ritual.' },
  { icon: '💬', name: 'Chat', blurb: 'Messages, photos, voice & video notes, and calls.' },
  { icon: '🍿', name: 'Watch', blurb: 'Watch YouTube together, perfectly in sync.' },
  { icon: '🎮', name: 'Games', blurb: 'Quizzes, truth-or-dare, drawing, karaoke and more.' },
  { icon: '✨', name: 'More', blurb: 'Album, calendar, savings, courses, secret chat… everything else.' },
]

// First-run welcome shown once per device after pairing. Sets the couple's
// "together since" date + a daily-ritual time, and tours the five tabs — so a
// feature-rich app feels inviting instead of overwhelming.
export function Onboarding({ onDone }: { onDone: () => void }) {
  const { partner, updateSince } = useCouple()
  const [step, setStep] = useState(0)
  const [since, setSince] = useState('')
  const [time, setTime] = useState('20:00')
  const [busy, setBusy] = useState(false)
  const who = partner?.name || 'your person'

  function finish() {
    try {
      localStorage.setItem(DONE_KEY, '1')
    } catch {
      /* ignore */
    }
    onDone()
  }

  async function saveSince() {
    setBusy(true)
    try {
      if (since) await updateSince(since)
    } catch {
      /* best-effort */
    } finally {
      setBusy(false)
      setStep(2)
    }
  }

  function saveTime() {
    setRitualTime(time)
    // Ask to allow notifications so the daily-moment nudge can reach them.
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
    setStep(3)
  }

  return (
    <div className="onb">
      <div className="onb-card">
        {step === 0 && (
          <div className="onb-step">
            <div className="onb-emoji">💞</div>
            <h1 className="welcome">You’re connected</h1>
            <p className="tagline">
              You and {who} now share a private space. Let’s set it up — takes 20 seconds.
            </p>
            <button className="btn" type="button" onClick={() => setStep(1)}>
              Let’s go
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="onb-step">
            <div className="onb-emoji">🗓️</div>
            <h1 className="welcome">When did it begin?</h1>
            <p className="tagline">We’ll count every day you’ve been together since.</p>
            <input
              className="input"
              type="date"
              value={since}
              onChange={(e) => setSince(e.target.value)}
            />
            <div className="row-actions onb-actions">
              <button className="btn" type="button" onClick={() => void saveSince()} disabled={busy}>
                {busy ? 'Saving…' : 'Next'}
              </button>
              <button className="link" type="button" onClick={() => setStep(2)}>
                Skip
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onb-step">
            <div className="onb-emoji">🔔</div>
            <h1 className="welcome">Your daily moment</h1>
            <p className="tagline">
              Couples who share a small daily ritual feel closest. Pick a time you’ll both check in.
            </p>
            <input
              className="input"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <div className="row-actions onb-actions">
              <button className="btn" type="button" onClick={saveTime}>
                Next
              </button>
              <button className="link" type="button" onClick={() => setStep(3)}>
                Skip
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onb-step">
            <h1 className="welcome">Here’s your space</h1>
            <div className="onb-tour">
              {TABS.map((t) => (
                <div key={t.name} className="onb-tab">
                  <span className="onb-tab-ico">{t.icon}</span>
                  <span className="onb-tab-text">
                    <b>{t.name}</b>
                    {t.blurb}
                  </span>
                </div>
              ))}
            </div>
            <button className="btn" type="button" onClick={finish}>
              Start exploring 💗
            </button>
          </div>
        )}

        <div className="onb-dots">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`onb-dot ${i === step ? 'on' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
