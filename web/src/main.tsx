import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider'
import { CoupleProvider } from './couple/CoupleProvider'
import { I18nProvider } from './lib/i18n'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        <CoupleProvider>
          <App />
        </CoupleProvider>
      </AuthProvider>
    </I18nProvider>
  </StrictMode>,
)

// Register the service worker only in production builds (keeps dev HMR clean).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is best-effort */
    })
  })
}
