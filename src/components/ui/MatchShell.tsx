import { GameCanvas } from '../canvas/GameCanvas'
import { OnlineBridge } from '../game/OnlineBridge'
import { useOnlineSync } from '../../hooks/useOnlineSync'
import { InGameHUD } from './InGameHUD'

export function MatchShell() {
  useOnlineSync()

  return (
    <div className="match-shell">
      <OnlineBridge />
      <div className="match-shell__canvas-wrap">
        <GameCanvas />
      </div>
      <InGameHUD />
    </div>
  )
}
