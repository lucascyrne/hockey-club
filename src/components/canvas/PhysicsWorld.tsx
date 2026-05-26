import { Physics } from '@react-three/rapier'
import type { ReactNode } from 'react'
import { GRAVITY, PHYSICS_TIMESTEP } from '../../constants/physics'
import { IS_DEV } from '../../lib/env'

type PhysicsWorldProps = {
  children: ReactNode
}

export function PhysicsWorld({ children }: PhysicsWorldProps) {
  return (
    <Physics
      gravity={GRAVITY}
      timeStep={PHYSICS_TIMESTEP}
      updatePriority={-50}
      interpolate
      maxCcdSubsteps={8}
      numSolverIterations={8}
      predictionDistance={0.004}
      debug={IS_DEV}
    >
      {children}
    </Physics>
  )
}
