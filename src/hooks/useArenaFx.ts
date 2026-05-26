import { useArenaFxStore } from '../stores/arenaFxStore'

export function useArenaFx() {
  const pulse = useArenaFxStore((s) => s.pulse)
  const goalFlash = useArenaFxStore((s) => s.goalFlash)
  return { pulse, goalFlash, isGoalFlashing: goalFlash > 0.15 }
}
