import { useState } from 'react'
import { useCouple } from '../couple/CoupleProvider'
import { COURSES } from '../lib/growth'

export function GuidedCourses() {
  const { couple, paired, setCourseProgress } = useCouple()
  const [openId, setOpenId] = useState<string | null>(null)

  if (!paired) return null

  const progress = couple?.courses ?? {}
  const open = COURSES.find((c) => c.id === openId)

  if (open) {
    const done = progress[open.id] ?? 0
    // Current lesson is the first not-yet-done one (clamped to last).
    const idx = Math.min(done, open.lessons.length - 1)
    const lesson = open.lessons[idx]
    const complete = done >= open.lessons.length
    return (
      <div className="card course-card">
        <h3 className="card-h muted-h">
          {open.emoji} {open.title}
        </h3>
        {complete ? (
          <>
            <div className="course-done">🎉 Course complete — nicely done, you two.</div>
            <div className="row-actions">
              <button type="button" className="btn btn-ghost" onClick={() => void setCourseProgress(open.id, 0)}>
                Restart
              </button>
              <button type="button" className="link" onClick={() => setOpenId(null)}>
                Back
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="course-step">
              Lesson {idx + 1} of {open.lessons.length}
            </div>
            <div className="course-lesson-title">{lesson.title}</div>
            <p className="course-body">{lesson.body}</p>
            <div className="course-prompt">💬 Try this: {lesson.prompt}</div>
            <div className="row-actions">
              <button type="button" className="btn" onClick={() => void setCourseProgress(open.id, idx + 1)}>
                Mark done · next
              </button>
              <button type="button" className="link" onClick={() => setOpenId(null)}>
                Back
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="card-h muted-h">Guided courses</h3>
      <div className="course-list">
        {COURSES.map((c) => {
          const done = Math.min(progress[c.id] ?? 0, c.lessons.length)
          const pct = Math.round((done / c.lessons.length) * 100)
          return (
            <button key={c.id} type="button" className="course-row" onClick={() => setOpenId(c.id)}>
              <span className="course-emoji">{c.emoji}</span>
              <span className="course-info">
                <span className="course-name">{c.title}</span>
                <span className="course-blurb">{c.blurb}</span>
                <span className="savings-bar course-bar">
                  <i style={{ width: `${pct}%` }} />
                </span>
              </span>
              <span className="course-count">
                {done}/{c.lessons.length}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
