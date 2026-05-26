import { GameCanvas } from '../canvas/GameCanvas'
import { InGameHUD } from './InGameHUD'

export function MatchShell() {
  return (
    <div className="match-shell">
      <div className="match-shell__canvas-wrap">
        <GameCanvas />
      </div>
      <InGameHUD />
    </div>
  )
}
