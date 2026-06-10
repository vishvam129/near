import { lazy, Suspense, useEffect, useState } from 'react'
import { BottomNav, type Tab } from './BottomNav'
import { LoveBurst } from './LoveBurst'
import { SignalOverlay } from './SignalOverlay'
import { ScheduledDelivery } from './ScheduledDelivery'
import { AlarmWatcher } from './AlarmWatcher'
import { listenForegroundPush } from '../lib/push'
import { CallUI } from './CallUI'
import { Onboarding, hasOnboarded } from './Onboarding'
import { RitualReminder } from './RitualReminder'

// Each tab is its own lazily-loaded chunk, so the initial download only ships
// the Home screen — the rest stream in on demand (much faster first load).
const Home = lazy(() => import('../pages/Home'))
const Chat = lazy(() => import('../pages/Chat'))
const Watch = lazy(() => import('../pages/Watch'))
const Games = lazy(() => import('../pages/Games'))
const More = lazy(() => import('../pages/More'))

function TabFallback() {
  return (
    <div className="screen tab-loading">
      <div className="spinner" aria-label="Loading" />
    </div>
  )
}

export default function Shell() {
  const [tab, setTab] = useState<Tab>('home')
  const [onboarding, setOnboarding] = useState(() => !hasOnboarded())
  // Show a notification for messages that arrive while the app is open.
  useEffect(() => listenForegroundPush(), [])

  if (onboarding) return <Onboarding onDone={() => setOnboarding(false)} />

  return (
    <div className="app">
      <div className="app-body">
        <Suspense fallback={<TabFallback />}>
          {tab === 'home' && <Home />}
          {tab === 'chat' && <Chat />}
          {tab === 'watch' && <Watch />}
          {tab === 'games' && <Games />}
          {tab === 'more' && <More />}
        </Suspense>
      </div>
      <BottomNav tab={tab} onTab={setTab} />
      <LoveBurst />
      <SignalOverlay />
      <CallUI />
      <RitualReminder />
      <ScheduledDelivery />
      <AlarmWatcher />
    </div>
  )
}
