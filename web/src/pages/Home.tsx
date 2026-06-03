import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'
import { Clocks } from '../components/Clocks'
import { Countdown } from '../components/Countdown'
import { TogetherCounter } from '../components/TogetherCounter'
import { DailyQuestion } from '../components/DailyQuestion'
import { Mood } from '../components/Mood'
import { ImportantDates } from '../components/ImportantDates'
import { Greeting } from '../components/Greeting'
import { Bedtime } from '../components/Bedtime'
import { OnThisDay } from '../components/OnThisDay'
import { HealthScore } from '../components/HealthScore'
import { WeeklyCheckin } from '../components/WeeklyCheckin'
import { ConnectionDeck } from '../components/ConnectionDeck'
import { BatteryShare } from '../components/BatteryShare'
import EditProfile from './EditProfile'

export default function Home() {
  const { logout } = useAuth()
  const { profile, partner, couple, sendPoke } = useCouple()
  const [editing, setEditing] = useState(false)
  const [poked, setPoked] = useState(false)

  async function thinkingOfYou() {
    try {
      await sendPoke()
      setPoked(true)
      window.setTimeout(() => setPoked(false), 1800)
    } catch {
      /* best-effort */
    }
  }

  // key on uid so the form re-initialises from fresh profile data if it changes
  if (editing) return <EditProfile key={profile?.uid} onDone={() => setEditing(false)} />

  return (
    <div className="screen">
      <div className="card">
        <div className="brand">
          <span className="dot" /> Near
        </div>
        <TogetherCounter />

        {couple?.streak?.count ? (
          <div className="streak-badge">🔥 {couple.streak.count}-day streak</div>
        ) : null}

        {profile && <Clocks you={profile} partner={partner} />}

        <OnThisDay />

        <HealthScore />

        <Greeting />

        <Bedtime />

        <Mood />

        <Countdown />

        <DailyQuestion />

        <WeeklyCheckin />

        <ImportantDates />

        <button className="btn love-send" type="button" onClick={thinkingOfYou} disabled={poked}>
          {poked ? 'Sent 💗' : '💗 Thinking of you'}
        </button>

        <ConnectionDeck />

        <BatteryShare />

        <button className="btn btn-ghost" type="button" onClick={() => setEditing(true)}>
          Edit your profile
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => void logout()}>
          Sign out
        </button>
      </div>
    </div>
  )
}
