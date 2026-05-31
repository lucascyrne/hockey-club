import type { RapierRigidBody } from '@react-three/rapier'
import { getPaddleVelocity } from '../lib/paddleRegistry'
import { paddleMotionState } from '../stores/paddleMotionState'
import { resolvePuckPaddleOverlaps } from './puckContact'
import { snapPuckToTablePlane } from './puckBounds'

/** Depenetração contínua disco–raquetes (P1 + P2). */
export function runPuckPaddleSafety(body: RapierRigidBody) {
  const pos = body.translation()
  const p1 = paddleMotionState.p1
  const p2 = paddleMotionState.p2

  resolvePuckPaddleOverlaps(body, pos.x, pos.z, [
    {
      x: p1.x,
      z: p1.z,
      vel: getPaddleVelocity(1),
      awayX: 1,
      clearTowardEnemyX: -1,
    },
    {
      x: p2.x,
      z: p2.z,
      vel: getPaddleVelocity(2),
      awayX: -1,
      clearTowardEnemyX: 1,
    },
  ])
  snapPuckToTablePlane(body)
}
