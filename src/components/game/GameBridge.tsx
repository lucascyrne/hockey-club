import { useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { triggerFaceoff } from '../../stores/puckActions'
import { getLateralFaceoffSpawn } from '../../systems/puckSpawn'
import { resetPaddlesToSpawn } from '../../systems/resetRound'

/** Liga regras (gol → pausa → saque lateral) sem re-renders no Canvas. */
export function GameBridge() {
  useEffect(() => {
    let prevPhase = useGameStore.getState().phase

    return useGameStore.subscribe((state) => {
      if (prevPhase === 'goal' && state.phase === 'playing') {
        resetPaddlesToSpawn()
        triggerFaceoff(getLateralFaceoffSpawn())
      }
      prevPhase = state.phase
    })
  }, [])

  return null
}
