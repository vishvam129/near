export type Tab = 'home' | 'chat' | 'watch' | 'more'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'chat', icon: '💬', label: 'Chat' },
  { id: 'watch', icon: '🍿', label: 'Watch' },
  { id: 'more', icon: '✨', label: 'More' },
]

export function BottomNav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`nav-btn ${tab === t.id ? 'active' : ''}`}
          onClick={() => onTab(t.id)}
        >
          <span className="nav-ico">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  )
}
