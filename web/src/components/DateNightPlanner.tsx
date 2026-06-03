import { useEffect, useState } from 'react'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useCouple } from '../couple/CoupleProvider'

type Vibe = { id: string; label: string; emoji: string; meals: string[]; acts: string[]; watch: string[] }

const VIBES: Vibe[] = [
  {
    id: 'cozy',
    label: 'Cozy night in',
    emoji: '🛋️',
    meals: ['Order the same takeout', 'Cook the same recipe on a video call', 'Build-your-own grilled cheese'],
    acts: ['Blanket fort + fairy lights', 'Read a chapter aloud to each other', 'Slow playlist & just talk'],
    watch: ['A comfort-movie rewatch', 'First episode of a new cozy show', 'A nostalgic childhood film'],
  },
  {
    id: 'adventure',
    label: 'Adventurous',
    emoji: '🧭',
    meals: ['Cook a dish from a country you’ll visit', 'Spicy-food challenge', 'Each pick a “mystery” snack for the other'],
    acts: ['Virtual museum tour together', 'Plan a future trip on a shared map', 'Learn 5 phrases in a new language'],
    watch: ['A travel documentary', 'A foreign film with subtitles', 'A survival/adventure series pilot'],
  },
  {
    id: 'playful',
    label: 'Playful & silly',
    emoji: '🎲',
    meals: ['Breakfast-for-dinner', 'Dessert first, no rules', 'Recreate a fast-food combo at home'],
    acts: ['Online co-op game', 'Drawing game over video', 'Truth or dare from the Games tab'],
    watch: ['A comedy special', 'A so-bad-it’s-good movie', 'A game show you can play along with'],
  },
  {
    id: 'romantic',
    label: 'Romantic',
    emoji: '🌹',
    meals: ['Candlelit dinner, same menu', 'Fancy dessert plating contest', 'Wine/tea tasting together'],
    acts: ['Slow dance to “your” song', 'Write each other a short letter', 'Stargaze on a call'],
    watch: ['A classic romance', 'The movie from your early days', 'A sunset together on video'],
  },
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

type Plan = { meal: string; act: string; watch: string }
type Saved = { id: string; vibe: string; meal: string; act: string; watch: string }

export function DateNightPlanner() {
  const { couple, paired } = useCouple()
  const coupleId = couple?.id
  const [vibe, setVibe] = useState<Vibe | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [saved, setSaved] = useState<Saved[]>([])

  useEffect(() => {
    if (!db || !coupleId) return
    const q = query(
      collection(db, 'couples', coupleId, 'dateplans'),
      orderBy('createdAt', 'desc'),
      limit(5),
    )
    return onSnapshot(q, (snap) =>
      setSaved(
        snap.docs.map((d) => ({
          id: d.id,
          vibe: d.data().vibe ?? '',
          meal: d.data().meal ?? '',
          act: d.data().act ?? '',
          watch: d.data().watch ?? '',
        })),
      ),
    )
  }, [coupleId])

  if (!paired) return null

  function roll(v: Vibe) {
    setVibe(v)
    setPlan({ meal: pick(v.meals), act: pick(v.acts), watch: pick(v.watch) })
  }

  async function save() {
    if (!db || !coupleId || !vibe || !plan) return
    await addDoc(collection(db, 'couples', coupleId, 'dateplans'), {
      vibe: `${vibe.emoji} ${vibe.label}`,
      ...plan,
      createdAt: serverTimestamp(),
    })
  }

  async function remove(id: string) {
    if (db && coupleId) await deleteDoc(doc(db, 'couples', coupleId, 'dateplans', id))
  }

  return (
    <div className="card planner-card">
      <h3 className="card-h muted-h">Date-night planner</h3>

      <div className="vibe-grid">
        {VIBES.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`vibe-pick ${vibe?.id === v.id ? 'sel' : ''}`}
            onClick={() => roll(v)}
          >
            <span className="vibe-emoji">{v.emoji}</span>
            {v.label}
          </button>
        ))}
      </div>

      {plan && vibe && (
        <div className="plan-out">
          <div className="plan-line">🍽️ {plan.meal}</div>
          <div className="plan-line">🎉 {plan.act}</div>
          <div className="plan-line">📺 {plan.watch}</div>
          <div className="row-actions">
            <button type="button" className="btn" onClick={() => roll(vibe)}>
              Shuffle
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void save()}>
              Save plan
            </button>
          </div>
        </div>
      )}

      {saved.length > 0 && (
        <div className="entry-list plan-saved">
          {saved.map((s) => (
            <div key={s.id} className="plan-saved-item">
              <div className="plan-saved-body">
                <span className="plan-saved-vibe">{s.vibe}</span>
                <span className="plan-saved-detail">
                  {s.meal} · {s.act} · {s.watch}
                </span>
              </div>
              <button
                type="button"
                className="entry-del"
                aria-label="Remove"
                onClick={() => void remove(s.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
