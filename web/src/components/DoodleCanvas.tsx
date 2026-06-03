import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'

const COLORS = ['#1f1b2e', '#ff6b8b', '#9b6dff', '#3ddc84', '#ffb877', '#3aa0ff']

export function DoodleCanvas({
  onSend,
  onClose,
}: {
  onSend: (dataUrl: string) => void
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const color = useRef(COLORS[0])

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const rect = c.getBoundingClientRect()
    c.width = rect.width
    c.height = rect.height
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 3.5
  }, [])

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
    ctx.strokeStyle = color.current
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
  function clear() {
    const c = canvasRef.current!
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
  }

  return (
    <div className="doodle-overlay" onClick={onClose}>
      <div className="doodle-pop" onClick={(e) => e.stopPropagation()}>
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
          className="doodle-canvas"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
        />
        <div className="doodle-actions">
          <button type="button" className="link" onClick={clear}>
            Clear
          </button>
          <button type="button" className="link" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onSend(canvasRef.current!.toDataURL('image/png'))}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
