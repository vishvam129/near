import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

// Multi-language + multi-currency UI (#95). A lightweight i18n layer: pick a
// language and currency (persisted on the device); strings come from the
// dictionary below and money is formatted with Intl for the chosen locale.

export type Lang = 'en' | 'es' | 'hi' | 'fr'
export type Theme = 'dark' | 'light'

export const LANGS: { code: Lang; label: string; locale: string }[] = [
  { code: 'en', label: 'English', locale: 'en-US' },
  { code: 'es', label: 'Español', locale: 'es-ES' },
  { code: 'hi', label: 'हिन्दी', locale: 'hi-IN' },
  { code: 'fr', label: 'Français', locale: 'fr-FR' },
]

export const CURRENCIES: { code: string; label: string }[] = [
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'INR', label: 'Indian Rupee (₹)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
]

type Dict = Record<Lang, string>
// Keyed UI strings. Add a key here and reference it via t('key').
const STRINGS: Record<string, Dict> = {
  'nav.home': { en: 'Home', es: 'Inicio', hi: 'होम', fr: 'Accueil' },
  'nav.chat': { en: 'Chat', es: 'Chat', hi: 'चैट', fr: 'Discuter' },
  'nav.watch': { en: 'Watch', es: 'Ver', hi: 'देखें', fr: 'Regarder' },
  'nav.games': { en: 'Games', es: 'Juegos', hi: 'खेल', fr: 'Jeux' },
  'nav.more': { en: 'More', es: 'Más', hi: 'और', fr: 'Plus' },
  'action.save': { en: 'Save', es: 'Guardar', hi: 'सहेजें', fr: 'Enregistrer' },
  'action.cancel': { en: 'Cancel', es: 'Cancelar', hi: 'रद्द करें', fr: 'Annuler' },
  'action.send': { en: 'Send', es: 'Enviar', hi: 'भेजें', fr: 'Envoyer' },
  'action.add': { en: 'Add', es: 'Añadir', hi: 'जोड़ें', fr: 'Ajouter' },
  'action.done': { en: 'Done', es: 'Hecho', hi: 'हो गया', fr: 'Terminé' },
  'settings.title': { en: 'Language & currency', es: 'Idioma y moneda', hi: 'भाषा और मुद्रा', fr: 'Langue et devise' },
  'settings.language': { en: 'Language', es: 'Idioma', hi: 'भाषा', fr: 'Langue' },
  'settings.currency': { en: 'Currency', es: 'Moneda', hi: 'मुद्रा', fr: 'Devise' },
  'settings.preview': { en: 'Example amount', es: 'Cantidad de ejemplo', hi: 'उदाहरण राशि', fr: 'Montant exemple' },
}

type I18nValue = {
  lang: Lang
  currency: string
  theme: Theme
  setLang: (l: Lang) => void
  setCurrency: (c: string) => void
  setTheme: (t: Theme) => void
  t: (key: string) => string
  money: (amount: number) => string
}

const I18nContext = createContext<I18nValue | undefined>(undefined)

function stored(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) || fallback
  } catch {
    return fallback
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => stored('near_lang', 'en') as Lang)
  const [currency, setCurrencyState] = useState<string>(() => stored('near_currency', 'USD'))
  const [theme, setThemeState] = useState<Theme>(() => stored('near_theme', 'dark') as Theme)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'light' ? '#fbf3ec' : '#16121d')
  }, [theme])

  const value = useMemo<I18nValue>(() => {
    const locale = LANGS.find((l) => l.code === lang)?.locale ?? 'en-US'
    return {
      lang,
      currency,
      theme,
      setLang: (l) => {
        setLangState(l)
        try {
          localStorage.setItem('near_lang', l)
        } catch {
          /* ignore */
        }
      },
      setCurrency: (c) => {
        setCurrencyState(c)
        try {
          localStorage.setItem('near_currency', c)
        } catch {
          /* ignore */
        }
      },
      setTheme: (t) => {
        setThemeState(t)
        try {
          localStorage.setItem('near_theme', t)
        } catch {
          /* ignore */
        }
      },
      t: (key) => STRINGS[key]?.[lang] ?? STRINGS[key]?.en ?? key,
      money: (amount) => {
        try {
          return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
        } catch {
          return `${amount}`
        }
      },
    }
  }, [lang, currency, theme])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
