import { useI18n } from '../lib/i18n'

export type Tab = 'home' | 'chat' | 'watch' | 'games' | 'more'

const TABS: { id: Tab; icon: string; key: string }[] = [
  { id: 'home', icon: '🏠', key: 'nav.home' },
  { id: 'chat', icon: '💬', key: 'nav.chat' },
  { id: 'watch', icon: '🍿', key: 'nav.watch' },
  { id: 'games', icon: '🎮', key: 'nav.games' },
  { id: 'more', icon: '✨', key: 'nav.more' },
]

export function BottomNav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const { t } = useI18n()
  return (
    <nav className="bottom-nav">
      {TABS.map((tb) => (
        <button
          key={tb.id}
          type="button"
          className={`nav-btn ${tab === tb.id ? 'active' : ''}`}
          onClick={() => onTab(tb.id)}
        >
          <span className="nav-ico">{tb.icon}</span>
          {t(tb.key)}
        </button>
      ))}
    </nav>
  )
}
