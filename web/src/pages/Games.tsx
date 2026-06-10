import { WouldYouRather } from '../components/games/WouldYouRather'
import { CompatQuiz } from '../components/games/CompatQuiz'
import { TicTacToe } from '../components/games/TicTacToe'
import { DrawReveal } from '../components/games/DrawReveal'
import { Whiteboard } from '../components/games/Whiteboard'
import { KnowMeQuiz } from '../components/games/KnowMeQuiz'
import { TruthOrDare } from '../components/games/TruthOrDare'
import { SpicyZone } from '../components/games/SpicyZone'
import { Karaoke } from '../components/games/Karaoke'

export default function Games() {
  return (
    <div className="screen more-screen">
      <div className="more-stack">
        <div className="brand more-brand">
          <span className="dot" /> Games
        </div>
        <div className="section-grid">
          <TicTacToe />
          <WouldYouRather />
          <DrawReveal />
          <Whiteboard />
          <CompatQuiz />
          <KnowMeQuiz />
          <TruthOrDare />
          <Karaoke />
          <SpicyZone />
        </div>
      </div>
    </div>
  )
}
