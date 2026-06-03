import { WouldYouRather } from '../components/games/WouldYouRather'
import { CompatQuiz } from '../components/games/CompatQuiz'
import { TicTacToe } from '../components/games/TicTacToe'
import { DrawReveal } from '../components/games/DrawReveal'
import { Whiteboard } from '../components/games/Whiteboard'
import { KnowMeQuiz } from '../components/games/KnowMeQuiz'
import { TruthOrDare } from '../components/games/TruthOrDare'

export default function Games() {
  return (
    <div className="screen more-screen">
      <div className="more-stack">
        <div className="brand more-brand">
          <span className="dot" /> Games
        </div>
        <TicTacToe />
        <WouldYouRather />
        <DrawReveal />
        <Whiteboard />
        <CompatQuiz />
        <KnowMeQuiz />
        <TruthOrDare />
      </div>
    </div>
  )
}
