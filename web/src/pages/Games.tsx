import { WouldYouRather } from '../components/games/WouldYouRather'
import { CompatQuiz } from '../components/games/CompatQuiz'
import { KnowMeQuiz } from '../components/games/KnowMeQuiz'
import { TruthOrDare } from '../components/games/TruthOrDare'

export default function Games() {
  return (
    <div className="screen more-screen">
      <div className="more-stack">
        <div className="brand more-brand">
          <span className="dot" /> Games
        </div>
        <WouldYouRather />
        <CompatQuiz />
        <KnowMeQuiz />
        <TruthOrDare />
      </div>
    </div>
  )
}
