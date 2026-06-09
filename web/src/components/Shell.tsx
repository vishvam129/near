import { useEffect, useState } from 'react'
import Home from '../pages/Home'
import Chat from '../pages/Chat'
import Watch from '../pages/Watch'
import Games from '../pages/Games'
import More from '../pages/More'
import { BottomNav, type Tab } from './BottomNav'
import { LoveBurst } from './LoveBurst'
import { SignalOverlay } from './SignalOverlay'
import { ScheduledDelivery } from './ScheduledDelivery'
import { AlarmWatcher } from './AlarmWatcher'
import { listenForegroundPush } from '../lib/push'
import { CallUI } from './CallUI'

export default function Shell() {
  const [tab, setTab] = useState<Tab>('home')
  // Show a notification for messages that arrive while the app is open.
  useEffect(() => listenForegroundPush(), [])
  return (
    <div className="app">
      <div className="app-body">
        {tab === 'home' && <Home />}
        {tab === 'chat' && <Chat />}
        {tab === 'watch' && <Watch />}
        {tab === 'games' && <Games />}
        {tab === 'more' && <More />}
      </div>
      <BottomNav tab={tab} onTab={setTab} />
      <LoveBurst />
      <SignalOverlay />
      <CallUI />
      <ScheduledDelivery />
      <AlarmWatcher />
    </div>
  )
}
