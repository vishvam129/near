import { useI18n, LANGS, CURRENCIES, type Lang } from '../lib/i18n'

const THEMES = [
  { id: 'dark' as const, label: '🌙 Dusk' },
  { id: 'light' as const, label: '☀️ Daylight' },
]

export function LanguageSettings() {
  const { lang, currency, theme, setLang, setCurrency, setTheme, t, money } = useI18n()

  return (
    <div className="card">
      <h3 className="card-h muted-h">{t('settings.title')}</h3>

      <label className="repair-label">Appearance</label>
      <div className="lang-grid">
        {THEMES.map((th) => (
          <button
            key={th.id}
            type="button"
            className={`chip ${theme === th.id ? 'chip-on' : ''}`}
            onClick={() => setTheme(th.id)}
          >
            {th.label}
          </button>
        ))}
      </div>

      <label className="repair-label">{t('settings.language')}</label>
      <div className="lang-grid">
        {LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            className={`chip ${lang === l.code ? 'chip-on' : ''}`}
            onClick={() => setLang(l.code as Lang)}
          >
            {l.label}
          </button>
        ))}
      </div>

      <label className="repair-label">{t('settings.currency')}</label>
      <select
        className="input"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>

      <div className="lang-preview">
        {t('settings.preview')}: <b>{money(1234.5)}</b>
      </div>
    </div>
  )
}
