import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useCouple } from '../../couple/CoupleProvider'

type Hit = { id: number; trackName: string; artistName: string; syncedLyrics?: string | null }
type Line = { t: number; text: string }

// Parse LRC ("[01:23.45] words") into time-ordered lines.
function parseLrc(lrc: string): Line[] {
  const out: Line[] = []
  for (const raw of lrc.split('\n')) {
    const text = raw.replace(/\[\d+:\d+(?:\.\d+)?\]/g, '').trim()
    const stamps = raw.match(/\[(\d+):(\d+(?:\.\d+)?)\]/g) || []
    for (const s of stamps) {
      const m = s.match(/\[(\d+):(\d+(?:\.\d+)?)\]/)
      if (m) out.push({ t: parseInt(m[1]) * 60 + parseFloat(m[2]), text })
    }
  }
  return out.sort((a, b) => a.t - b.t)
}

export function Karaoke() {
  const { couple, paired, setKaraoke } = useCouple()
  const song = couple?.karaoke ?? null

  const [q, setQ] = useState('')
  const [hits, setHits] = useState<Hit[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // playback timer (local — both partners press play to sing along together)
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(false)
  const startedAt = useRef(0)
  const raf = useRef<number | undefined>(undefined)
  const activeRef = useRef<HTMLDivElement>(null)

  const lines = song ? parseLrc(song.lrc) : []
  const activeIdx = lines.reduce((acc, l, i) => (l.t <= elapsed ? i : acc), -1)

  useEffect(() => {
    if (!playing) return
    startedAt.current = performance.now() - elapsed * 1000
    const endAt = lines.length ? lines[lines.length - 1].t + 4 : 0
    const tick = () => {
      const e = (performance.now() - startedAt.current) / 1000
      setElapsed(e)
      if (endAt && e > endAt) {
        setPlaying(false) // stop the loop once the song's lyrics are done
        return
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  // Scroll only when the highlighted line actually changes.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [activeIdx])

  if (!paired) return null

  async function search(e: FormEvent) {
    e.preventDefault()
    if (!q.trim()) return
    setSearching(true)
    setErr(null)
    try {
      const r = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q.trim())}`)
      if (!r.ok) throw new Error('search failed')
      const data: Hit[] = await r.json()
      setHits(data.filter((h) => h.syncedLyrics))
    } catch {
      setErr('Couldn’t reach the lyrics service. Try again.')
    } finally {
      setSearching(false)
    }
  }

  function choose(h: Hit) {
    void setKaraoke({ title: h.trackName, artist: h.artistName, lrc: h.syncedLyrics || '' })
    setHits(null)
    setQ('')
    setElapsed(0)
    setPlaying(false)
  }

  if (song) {
    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${song.artist} ${song.title}`,
    )}`
    return (
      <div className="card karaoke-card">
        <h3 className="card-h muted-h">🎤 Karaoke</h3>
        <div className="karaoke-now">
          <b>{song.title}</b>
          <span>{song.artist}</span>
        </div>

        <div className="karaoke-lyrics">
          {lines.length === 0 ? (
            <p className="entry-empty">No synced lyrics for this one — pick another.</p>
          ) : (
            lines.map((l, i) => (
              <div
                key={i}
                ref={i === activeIdx ? activeRef : undefined}
                className={`karaoke-line ${i === activeIdx ? 'active' : ''} ${
                  i < activeIdx ? 'past' : ''
                }`}
              >
                {l.text || '♪'}
              </div>
            ))
          )}
        </div>

        <div className="row-actions karaoke-controls">
          <button type="button" className="btn" onClick={() => setPlaying((p) => !p)}>
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setPlaying(false)
              setElapsed(0)
            }}
          >
            ⟲ Restart
          </button>
        </div>
        <a className="link karaoke-yt" href={ytUrl} target="_blank" rel="noreferrer">
          ▶ Open the song on YouTube (play, then hit ▶ here together)
        </a>
        <button type="button" className="link" onClick={() => void setKaraoke(null)}>
          Pick a different song
        </button>
      </div>
    )
  }

  return (
    <div className="card karaoke-card">
      <h3 className="card-h muted-h">🎤 Karaoke</h3>
      <p className="entry-empty">Search a song — pick one with synced lyrics and sing it together.</p>
      <form className="form entry-form" onSubmit={search}>
        <input
          className="input"
          type="text"
          placeholder="Song or artist…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn" type="submit" disabled={searching || !q.trim()}>
          {searching ? '…' : 'Search'}
        </button>
      </form>
      {err && <div className="err">{err}</div>}
      {hits && (
        <div className="entry-list karaoke-hits">
          {hits.length === 0 ? (
            <p className="entry-empty">No synced lyrics found — try another search.</p>
          ) : (
            hits.slice(0, 8).map((h) => (
              <button key={h.id} type="button" className="karaoke-hit" onClick={() => choose(h)}>
                <span className="karaoke-hit-title">{h.trackName}</span>
                <span className="karaoke-hit-artist">{h.artistName}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
