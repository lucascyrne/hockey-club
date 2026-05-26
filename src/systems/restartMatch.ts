import { useGameStore } from '../stores/gameStore'
import { triggerFaceoff } from '../stores/puckActions'
import { getLateralFaceoffSpawn } from './puckSpawn'
import { resetPaddlesToSpawn } from './resetRound'

/** Reinicia a partida atual (placar, raquetes, saque lateral). */
export function restartCurrentMatch() {
  useGameStore.getState().resetMatch()
  resetPaddlesToSpawn()
  triggerFaceoff(getLateralFaceoffSpawn())
}
