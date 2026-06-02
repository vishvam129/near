import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'
import { Clocks } from '../components/Clocks'
import { Countdown } from '../components/Countdown'
import { TogetherCounter } from '../components/TogetherCounter'
import EditProfile from './EditProfile'

export default function Home() {
  const { logout } = useAuth()
  const { profile, partner } = useCouple()
  const [editing, setEditing] = useState(false)

  // key on uid so the form re-initialises from fresh profile data if it changes
  if (editing) return <EditProfile key={profile?.uid} onDone={() => setEditing(false)} />

  return (
    <div className="screen">
      <div className="card">
        <div className="brand">
          <span className="dot" /> Near
        </div>
        <TogetherCounter />

        {profile && <Clocks you={profile} partner={partner} />}

        <Countdown />

        <button className="btn" type="button" onClick={() => setEditing(true)}>
          Edit your profile
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => void logout()}>
          Sign out
        </button>
      </div>
    </div>
  )
}
