import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useCouple } from '../couple/CoupleProvider'

type Hit = { title: string; years: number }

export function OnThisDay() {
  const { couple } = useCouple()
  const [hits, setHits] = useState<Hit[]>([])
  const coupleId = couple?.id

  useEffect(() => {
    if (!db || !coupleId) return
    return onSnapshot(collection(db, 'couples', coupleId, 'milestones'), (snap) => {
      const now = new Date()
      const found: Hit[] = []
      snap.docs.forEach((d) => {
        const dateStr = d.data().date as string | undefined
        const title = (d.data().title as string) ?? ''
        if (!dateStr) return
        const m = new Date(dateStr + 'T00:00:00')
        if (isNaN(m.getTime())) return
        if (m.getMonth() === now.getMonth() && m.getDate() === now.getDate()) {
          const years = now.getFullYear() - m.getFullYear()
          if (years >= 0) found.push({ title, years })
        }
      })
      setHits(found)
    })
  }, [coupleId])

  if (hits.length === 0) return null

  return (
    <div className="card on-this-day">
      <h3 className="card-h muted-h">On this day 💞</h3>
      {hits.map((h, i) => (
        <div key={i} className="otd-item">
          <strong>{h.title}</strong>
          {h.years > 0 && (
            <span className="otd-years">
              {' '}
              · {h.years} {h.years === 1 ? 'year' : 'years'} ago today
            </span>
          )}
          {h.years === 0 && <span className="otd-years"> · today!</span>}
        </div>
      ))}
    </div>
  )
}
