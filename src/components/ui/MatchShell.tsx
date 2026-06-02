import { GameCanvas } from '../canvas/GameCanvas'
import { useOnlineMatch } from '../../hooks/useOnlineMatch'
import { InGameHUD } from './InGameHUD'

export function MatchShell() {
  useOnlineMatch()

  return (
    <div className="match-shell">
      <div className="match-shell__canvas-wrap">
        <GameCanvas />
      </div>
      <InGameHUD />
    </div>
  )
}
