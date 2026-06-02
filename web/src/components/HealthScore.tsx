import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../couple/CoupleProvider'

export function HealthScore() {
  const { user } = useAuth()
  const { couple, partner } = useCouple()
  if (!couple) return null

  const myUid = user?.uid
  const partnerUid = partner?.uid
  const bothMoods = Boolean(myUid && partnerUid && couple.moods?.[myUid] && couple.moods?.[partnerUid])
  const greetRecent = Boolean(
    couple.greeting?.at && Date.now() - couple.greeting.at.getTime() < 24 * 3600_000,
  )

  let score = 15
  score += Math.min(40, (couple.streak?.count ?? 0) * 4)
  if (couple.nextMeetup) score += 12
  if (couple.savings) score += 5
  if (couple.watch) score += 4
  if (bothMoods) score += 8
  if (greetRecent) score += 8
  score = Math.max(0, Math.min(100, Math.round(score)))

  const tier =
    score >= 80
      ? { label: 'Thriving 💞', tip: 'You two are in a great rhythm — keep it up!' }
      : score >= 55
        ? { label: 'Going strong 💪', tip: 'Try a daily question or a watch-together this week.' }
        : score >= 30
          ? { label: 'Keep nurturing 🌱', tip: 'Set a next-visit countdown and send a little love.' }
          : { label: 'Needs some love 💗', tip: 'Say good morning and answer today’s question together.' }

  return (
    <div className="card health">
      <h3 className="card-h muted-h">Connection score</h3>
      <div className="health-row">
        <div className="health-ring" style={{ '--pct': `${score}` } as React.CSSProperties}>
          <span className="health-num">{score}</span>
        </div>
        <div className="health-info">
          <div className="health-label">{tier.label}</div>
          <div className="health-tip">{tier.tip}</div>
        </div>
      </div>
    </div>
  )
}
