import { stepPaddleMotion as stepPaddleMotionCore } from '../../shared/sim/paddleMotion'
import { getPaddleMaxSpeed, getPaddleSpeedLevel } from './paddleFeel'
import type { PlayerId } from '../systems/bounds'

export type { PlanarMotion } from '../../shared/sim/paddleMotion'
export { createPlanarMotion } from '../../shared/sim/paddleMotion'

export function stepPaddleMotion(
  motion: Parameters<typeof stepPaddleMotionCore>[0],
  targetX: number,
  targetZ: number,
  playerId: PlayerId,
  delta: number,
) {
  return stepPaddleMotionCore(motion, targetX, targetZ, playerId, delta, {
    maxSpeed: getPaddleMaxSpeed(getPaddleSpeedLevel(playerId)),
  })
}
