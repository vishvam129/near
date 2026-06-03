import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../auth/AuthProvider'
import { useCouple } from '../../couple/CoupleProvider'

const PROMPTS = [
  'your partner',
  'your dream house',
  'a perfect date',
  'your favorite memory of us',
  'an inside joke',
  'your pet (real or future)',
  'us in 10 years',
  'your happy place',
]

export function DrawReveal() {
  const { user } = useAuth()
  const { couple, partner } = useCouple()
  const coupleId = couple?.id
  const [data, setData] = useState<{ prompt: string; images: Record<string, string> } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!db || !coupleId) return
    return onSnapshot(doc(db, 'couples', coupleId, 'drawreveal', 'current'), (s) => {
      const d = s.data()
      setData(d ? { prompt: d.prompt ?? '', images: d.images ?? {} } : null)
    })
  }, [coupleId])

  const myImg = user ? data?.images?.[user.uid] : undefined
  const theirImg = partner ? data?.images?.[partner.uid] : undefined
  const bothIn = Boolean(myImg && theirImg)
  const drawingMode = Boolean(data && !myImg && !bothIn)

  useEffect(() => {
    if (!drawingMode) return
    const c = canvasRef.current
    if (!c) return
    const rect = c.getBoundingClientRect()
    c.width = rect.width
    c.height = rect.height
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1f1b2e'
  }, [drawingMode, data?.prompt])

  function pos(e: ReactPointerEvent<HTMLCanvasElement>) {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  function down(e: ReactPointerEvent<HTMLCanvasElement>) {
    drawing.current = true
    last.current = pos(e)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function move(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext('2d')!
    const p = pos(e)
    ctx.beginPath()
    ctx.moveTo(last.current!.x, last.current!.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }
  function up() {
    drawing.current = false
    last.current = null
  }
  function clearCanvas() {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
  }

  async function newRound() {
    if (!db || !coupleId) return
    const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
    await setDoc(doc(db, 'couples', coupleId, 'drawreveal', 'current'), {
      prompt,
      images: {},
      startedAt: serverTimestamp(),
    })
  }
  async function submit() {
    if (!db || !coupleId || !user || !canvasRef.current) return
    const url = canvasRef.current.toDataURL('image/png')
    await setDoc(
      doc(db, 'couples', coupleId, 'drawreveal', 'current'),
      { images: { [user.uid]: url } },
      { merge: true },
    )
  }

  const partnerName = partner?.name || 'your partner'

  return (
    <div className="card game-card">
      <h3 className="card-h muted-h">Draw &amp; reveal</h3>
      {!data ? (
        <>
          <p className="entry-empty">Both draw the same prompt, then reveal together.</p>
          <button type="button" className="btn" onClick={() => void newRound()}>
            Start a round
          </button>
        </>
      ) : (
        <>
          <div className="dr-prompt">
            Draw: <strong>{data.prompt}</strong>
          </div>
          {bothIn ? (
            <div className="dr-reveal">
              <div className="dr-col">
                <span className="entry-who">You</span>
                <img className="dr-img" src={myImg} alt="your drawing" />
              </div>
              <div className="dr-col">
                <span className="entry-who">{partnerName}</span>
                <img className="dr-img" src={theirImg} alt="their drawing" />
              </div>
              <button type="button" className="btn btn-ghost dr-new" onClick={() => void newRound()}>
                New round
              </button>
            </div>
          ) : myImg ? (
            <div className="dr-col">
              <img className="dr-img" src={myImg} alt="your drawing" />
              <p className="entry-empty">Sent! Waiting for {partnerName} to draw…</p>
            </div>
          ) : (
            <>
              <canvas
                ref={canvasRef}
                className="doodle-canvas"
                onPointerDown={down}
                onPointerMove={move}
                onPointerUp={up}
                onPointerLeave={up}
              />
              <div className="row-actions">
                <button type="button" className="link" onClick={clearCanvas}>
                  Clear
                </button>
                <button type="button" className="btn" onClick={() => void submit()}>
                  Submit drawing
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
