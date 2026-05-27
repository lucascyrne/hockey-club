import { useEffect } from 'react'
import { useDemoPuckStallWatch } from '../../hooks/useDemoPuckStallWatch'
import { useMenuDemoStore } from '../../stores/menuDemoStore'
import { useGameStore } from '../../stores/gameStore'
import { resetPaddlesToSpawn } from '../../systems/resetRound'
import { triggerFaceoff } from '../../stores/puckActions'
import { getLateralFaceoffSpawn } from '../../systems/puckSpawn'

/** Demo do menu: stall watch + reset ao montar/desmontar. Gol contínuo em Puck.tsx. */
export function DemoGameBridge() {
  const setDemoActive = useMenuDemoStore((s) => s.setActive)
  useDemoPuckStallWatch()

  useEffect(() => {
    setDemoActive(true)
    useGameStore.getState().resetMatch()
    resetPaddlesToSpawn()
    triggerFaceoff(getLateralFaceoffSpawn())

    return () => {
      setDemoActive(false)
      useGameStore.getState().resetMatch()
      resetPaddlesToSpawn()
    }
  }, [setDemoActive])

  return null
}
