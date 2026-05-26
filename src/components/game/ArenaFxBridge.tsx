import { useEffect, useRef } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { isMenuDemoActive } from '../../stores/menuDemoStore'
import { useArenaFxStore } from '../../stores/arenaFxStore'

/** Dispara flash de gol no ambiente (fora do Canvas de áudio). */
export function ArenaFxBridge() {
  const triggerGoal = useArenaFxStore((s) => s.triggerGoal)
  const prevPhase = useRef(useGameStore.getState().phase)

  useEffect(() => {
    return useGameStore.subscribe((state) => {
      if (isMenuDemoActive()) {
        prevPhase.current = state.phase
        return
      }
      if (prevPhase.current === 'playing' && state.phase === 'goal') {
        triggerGoal()
      }
      prevPhase.current = state.phase
    })
  }, [triggerGoal])

  return null
}
