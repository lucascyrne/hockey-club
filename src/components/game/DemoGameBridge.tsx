import { useEffect } from 'react'
import { useDemoPuckStallWatch } from '../../hooks/useDemoPuckStallWatch'
import { useMenuDemoStore } from '../../stores/menuDemoStore'
import { useGameStore } from '../../stores/gameStore'
import { triggerFaceoff } from '../../stores/puckActions'
import { getLateralFaceoffSpawn } from '../../systems/puckSpawn'
import { resetPaddlesToSpawn } from '../../systems/resetRound'

/** Liga gols do hero da landing (pausa → saque lateral). */
export function DemoGameBridge() {
  const setDemoActive = useMenuDemoStore((s) => s.setActive)
  useDemoPuckStallWatch()

  useEffect(() => {
    setDemoActive(true)
    useGameStore.getState().resetMatch()
    resetPaddlesToSpawn()

    let prevPhase = useGameStore.getState().phase

    const unsubGame = useGameStore.subscribe((state) => {
      if (prevPhase === 'goal' && state.phase === 'playing') {
        resetPaddlesToSpawn()
        triggerFaceoff(getLateralFaceoffSpawn())
      }
      prevPhase = state.phase
    })

    return () => {
      unsubGame()
      setDemoActive(false)
      useGameStore.getState().resetMatch()
      resetPaddlesToSpawn()
    }
  }, [setDemoActive])

  return null
}
