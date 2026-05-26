import { PADDLE_SPAWN } from '../constants/paddle'
import { createPlanarMotion } from '../lib/paddleMotion'
import { paddleMotionState } from '../stores/paddleMotionState'
import { paddleTargets } from '../stores/paddleTargets'

export function resetPaddlesToSpawn() {
  paddleTargets.p1.x = PADDLE_SPAWN.p1.x
  paddleTargets.p1.z = PADDLE_SPAWN.p1.z
  paddleTargets.p2.x = PADDLE_SPAWN.p2.x
  paddleTargets.p2.z = PADDLE_SPAWN.p2.z

  Object.assign(paddleMotionState.p1, createPlanarMotion(PADDLE_SPAWN.p1.x, PADDLE_SPAWN.p1.z))
  Object.assign(paddleMotionState.p2, createPlanarMotion(PADDLE_SPAWN.p2.x, PADDLE_SPAWN.p2.z))
}
