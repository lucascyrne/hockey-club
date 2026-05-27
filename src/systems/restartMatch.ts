import { useGameStore } from '../stores/gameStore'
import { beginRoundCountdown } from './roundCountdown'
import { resetPaddlesToSpawn } from './resetRound'

/** Reinicia a partida atual (placar, raquetes, contagem + saque lateral). */
export function restartCurrentMatch() {
  useGameStore.getState().resetMatch()
  resetPaddlesToSpawn()
  beginRoundCountdown()
}
