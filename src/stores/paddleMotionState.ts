import { PADDLE_SPAWN } from '../constants/paddle'
import { createPlanarMotion, type PlanarMotion } from '../lib/paddleMotion'

export const paddleMotionState: { p1: PlanarMotion; p2: PlanarMotion } = {
  p1: createPlanarMotion(PADDLE_SPAWN.p1.x, PADDLE_SPAWN.p1.z),
  p2: createPlanarMotion(PADDLE_SPAWN.p2.x, PADDLE_SPAWN.p2.z),
}
