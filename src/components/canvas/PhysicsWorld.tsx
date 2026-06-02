import { Physics } from '@react-three/rapier'
import type { ReactNode } from 'react'
import { GRAVITY, PHYSICS_TIMESTEP } from '../../constants/physics'
import { IS_DEV } from '../../lib/env'
import { useGameStore } from '../../stores/gameStore'
import { useSessionStore } from '../../stores/sessionStore'

type PhysicsWorldProps = {
  children: ReactNode
}

export function PhysicsWorld({ children }: PhysicsWorldProps) {
  const online = useSessionStore(
    (s) => s.screen === 'match' && s.matchMode === 'online',
  )
  const paused = useSessionStore((s) => {
    if (s.screen !== 'match') return false
    if (online) {
      return s.hudDrawerOpen || s.settingsOpen
    }
    if (s.hudDrawerOpen || s.settingsOpen) return true
    return useGameStore.getState().phase === 'countdown'
  })

  return (
    <Physics
      gravity={GRAVITY}
      timeStep={PHYSICS_TIMESTEP}
      paused={paused}
      updatePriority={-50}
      interpolate={!online}
      maxCcdSubsteps={8}
      numSolverIterations={8}
      predictionDistance={0.004}
      debug={IS_DEV}
    >
      {children}
    </Physics>
  )
}
