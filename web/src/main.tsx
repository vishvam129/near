import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider'
import { CoupleProvider } from './couple/CoupleProvider'
import { CallProvider } from './calls/CallProvider'
import { I18nProvider } from './lib/i18n'
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <AuthProvider>
          <CoupleProvider>
            <CallProvider>
              <App />
            </CallProvider>
          </CoupleProvider>
        </AuthProvider>
      </I18nProvider>
    </ErrorBoundary>
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
