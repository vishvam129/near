import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'

function extractVideoId(input: string): string | null {
  const s = input.trim()
  if (/^[\w-]{11}$/.test(s)) return s
  const m = s.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/)
  return m ? m[1] : null
}

let ytPromise: Promise<Window['YT']> | null = null
function loadYT(): Promise<Window['YT']> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (ytPromise) return ytPromise
  ytPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve(window.YT)
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
  return ytPromise
}

export default function Watch() {
  const { user } = useAuth()
  const { couple, updateWatch } = useCouple()
  const myUid = user?.uid
  const watch = couple?.watch ?? null

  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const applyingRemote = useRef(false)
  const lastAppliedAt = useRef(0)
  const [ready, setReady] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Create the player once a video exists.
  useEffect(() => {
    if (!watch?.videoId || !hostRef.current || playerRef.current) return
    let cancelled = false
    void loadYT().then((YT) => {
      if (cancelled || !YT || !hostRef.current) return
      playerRef.current = new YT.Player(hostRef.current, {
        videoId: watch.videoId,
        playerVars: { playsinline: 1, rel: 0 },
        events: {
          onReady: () => {
            setReady(true)
            lastAppliedAt.current = watch.updatedAt
          },
          onStateChange: (e: { data: number }) => {
            if (applyingRemote.current || !playerRef.current) return
            const YTns = window.YT
            const pos = playerRef.current.getCurrentTime?.() ?? 0
            const id = playerRef.current.getVideoData?.().video_id ?? watch.videoId
            if (e.data === YTns?.PlayerState.PLAYING) {
              void updateWatch({ videoId: id, playing: true, positionSec: pos })
            } else if (e.data === YTns?.PlayerState.PAUSED) {
              void updateWatch({ videoId: id, playing: false, positionSec: pos })
            }
          },
        },
      })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch?.videoId])

  // Apply the partner's changes to our player.
  useEffect(() => {
    const p = playerRef.current
    if (!watch || !p || !ready) return
    if (watch.updatedBy === myUid) {
      lastAppliedAt.current = watch.updatedAt
      return
    }
    if (watch.updatedAt <= lastAppliedAt.current) return
    lastAppliedAt.current = watch.updatedAt
    applyingRemote.current = true
    try {
      if (p.getVideoData?.().video_id !== watch.videoId) {
        p.loadVideoById(watch.videoId, watch.positionSec)
      } else {
        const cur = p.getCurrentTime?.() ?? 0
        if (Math.abs(cur - watch.positionSec) > 2) p.seekTo(watch.positionSec, true)
      }
      if (watch.playing) p.playVideo?.()
      else p.pauseVideo?.()
    } finally {
      window.setTimeout(() => {
        applyingRemote.current = false
      }, 600)
    }
  }, [watch, ready, myUid])

  function loadUrl(e: FormEvent) {
    e.preventDefault()
    const id = extractVideoId(urlInput)
    if (!id) {
      setError('Paste a valid YouTube link.')
      return
    }
    setError(null)
    setUrlInput('')
    if (playerRef.current) {
      applyingRemote.current = true
      playerRef.current.loadVideoById(id, 0)
      window.setTimeout(() => (applyingRemote.current = false), 600)
    }
    lastAppliedAt.current = Date.now()
    void updateWatch({ videoId: id, playing: true, positionSec: 0 })
  }

  return (
    <div className="screen watch-screen">
      <div className="card watch-card">
        <div className="brand">
          <span className="dot" /> Watch together
        </div>

        {watch?.videoId ? (
          <div className="watch-player">
            <div ref={hostRef} className="watch-frame" />
          </div>
        ) : (
          <div className="watch-empty">
            🍿 Paste a YouTube link to start watching in sync — you’ll both see play,
            pause, and skips together.
          </div>
        )}

        <form className="watch-form" onSubmit={loadUrl}>
          <input
            className="input"
            type="text"
            placeholder="Paste a YouTube link…"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <button className="btn" type="submit" disabled={!urlInput.trim()}>
            Play
          </button>
        </form>
        {error && <div className="err">{error}</div>}

        <p className="watch-hint">
          ▶ Press play/pause or skip — it stays in sync for both of you.
        </p>
      </div>
    </div>
  )
}
