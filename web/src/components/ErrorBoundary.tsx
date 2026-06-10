import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null; info: string }

// Catches render errors anywhere below it so a crash shows the actual message
// (and a recovery button) instead of a blank white screen.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: '' }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info)
    this.setState({ info: info.componentStack || '' })
  }

  async hardReset() {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((r) => r.unregister()))
      }
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
    } finally {
      location.reload()
    }
  }

  render() {
    const { error, info } = this.state
    if (!error) return this.props.children
    return (
      <div className="auth-wrap">
        <div className="card" style={{ maxWidth: 480, textAlign: 'left' }}>
          <div className="brand">
            <span className="dot" /> Near
          </div>
          <h1 className="welcome">Something broke 😕</h1>
          <p className="tagline">The app hit an error. This message helps us fix it:</p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: 12,
              background: 'var(--panel-2)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: 12,
              maxHeight: 240,
              overflow: 'auto',
            }}
          >
            {error.message}
            {info ? `\n\nWhere:${info.split('\n').slice(0, 6).join('\n')}` : ''}
          </pre>
          <button className="btn" type="button" onClick={() => location.reload()}>
            Reload
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => void this.hardReset()}>
            Reset app (clear cache)
          </button>
        </div>
      </div>
    )
  }
}
