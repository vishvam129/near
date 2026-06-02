import { useState } from 'react'
import Home from '../pages/Home'
import Chat from '../pages/Chat'
import { BottomNav, type Tab } from './BottomNav'
import { LoveBurst } from './LoveBurst'

export default function Shell() {
  const [tab, setTab] = useState<Tab>('home')
  return (
    <div className="app">
      <div className="app-body">{tab === 'home' ? <Home /> : <Chat />}</div>
      <BottomNav tab={tab} onTab={setTab} />
      <LoveBurst />
    </div>
  )
}
