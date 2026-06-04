import { MAX_PADDLE_SPEED, PADDLE_RESPONSE } from './paddleConstants.js'
import { clampPaddlePosition, type PlayerId } from './bounds.js'

export type PlanarMotion = {
  x: number
  z: number
  vx: number
  vz: number
}

export function createPlanarMotion(x: number, z: number): PlanarMotion {
  return { x, z, vx: 0, vz: 0 }
}

export function stepPaddleMotion(
  motion: PlanarMotion,
  targetX: number,
  targetZ: number,
  playerId: PlayerId,
  delta: number,
  opts?: { maxSpeed?: number },
) {
  const { x: tx, z: tz } = clampPaddlePosition(targetX, targetZ, playerId)
  const dx = tx - motion.x
  const dz = tz - motion.z
  const blend = 1 - Math.exp(-PADDLE_RESPONSE * delta)
  let moveX = dx * blend
  let moveZ = dz * blend
  const maxMove = (opts?.maxSpeed ?? MAX_PADDLE_SPEED) * delta
  const moveLen = Math.hypot(moveX, moveZ)
  if (moveLen > maxMove) {
    const s = maxMove / moveLen
    moveX *= s
    moveZ *= s
  }
  const prevX = motion.x
  const prevZ = motion.z
  motion.x += moveX
  motion.z += moveZ
  if (delta > 1e-6) {
    motion.vx = (motion.x - prevX) / delta
    motion.vz = (motion.z - prevZ) / delta
  }
  const clamped = clampPaddlePosition(motion.x, motion.z, playerId)
  motion.x = clamped.x
  motion.z = clamped.z
  return motion
}
