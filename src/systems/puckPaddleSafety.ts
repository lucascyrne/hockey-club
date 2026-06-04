import type { RapierRigidBody } from '@react-three/rapier'
import { runPuckPaddleSafety as runPuckPaddleSafetyCore } from '../../shared/sim/puckPaddleSafety'
import { getPaddleVelocity } from '../lib/paddleRegistry'
import { paddleMotionState } from '../stores/paddleMotionState'

export function runPuckPaddleSafety(body: RapierRigidBody) {
  const p1 = paddleMotionState.p1
  const p2 = paddleMotionState.p2

  runPuckPaddleSafetyCore(body, [
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
}
