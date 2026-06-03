import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useCouple } from '../../couple/CoupleProvider'

const COLORS = ['#1f1b2e', '#ff6b8b', '#9b6dff', '#3ddc84', '#ffb877']
type Point = { x: number; y: number }
type Stroke = { points: Point[]; color: string }

export function Whiteboard() {
  const { couple } = useCouple()
  const coupleId = couple?.id
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokes = useRef<Stroke[]>([])
  const current = useRef<Point[]>([])
  const drawing = useRef(false)
  const color = useRef(COLORS[0])

  function redraw() {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const all = [...strokes.current]
    if (current.current.length) all.push({ points: current.current, color: color.current })
    for (const s of all) {
      ctx.strokeStyle = s.color
      ctx.beginPath()
      s.points.forEach((p, i) => {
        const x = p.x * c.width
        const y = p.y * c.height
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }
  }

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const rect = c.getBoundingClientRect()
    c.width = rect.width
    c.height = rect.height
    redraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!db || !coupleId) return
    const q = query(collection(db, 'couples', coupleId, 'whiteboard'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snap) => {
      strokes.current = snap.docs.map((d) => ({
        points: d.data().points ?? [],
        color: d.data().color ?? '#000',
      }))
      redraw()
    })
  }, [coupleId])

  function pos(e: ReactPointerEvent<HTMLCanvasElement>): Point {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }
  }
  function down(e: ReactPointerEvent<HTMLCanvasElement>) {
    drawing.current = true
    current.current = [pos(e)]
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function move(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    current.current.push(pos(e))
    redraw()
  }
  async function up() {
    if (!drawing.current) return
    drawing.current = false
    const pts = current.current
    current.current = []
    redraw()
    if (pts.length > 1 && db && coupleId) {
      await addDoc(collection(db, 'couples', coupleId, 'whiteboard'), {
        points: pts,
        color: color.current,
        createdAt: serverTimestamp(),
      })
    }
  }
  async function clear() {
    if (!db || !coupleId) return
    const snap = await getDocs(collection(db, 'couples', coupleId, 'whiteboard'))
    const batch = writeBatch(db)
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }

  return (
    <div className="card game-card">
      <h3 className="card-h muted-h">Shared whiteboard</h3>
      <div className="doodle-colors">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className="doodle-color"
            style={{ background: c }}
            aria-label="color"
            onClick={() => (color.current = c)}
          />
        ))}
      </div>
      <canvas
        ref={canvasRef}
        className="doodle-canvas wb-canvas"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
      />
      <button type="button" className="btn btn-ghost" onClick={() => void clear()}>
        Clear board
      </button>
    </div>
  )
}
