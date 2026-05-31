import { getPaddleMaxSpeed, getPaddleSpeedLevel } from '../../lib/paddleFeel'
import { PUCK_PADDLE_MIN_DIST } from '../../systems/puckContact'
import type { CpuConfig } from '../config'
import type { PlayerId } from '../../systems/bounds'
import { clampPaddlePosition } from '../../systems/bounds'
import type { Vec2 } from '../types'

export function applyExecutionError(
  target: Vec2,
  error: Vec2,
  nearPuck: boolean,
  yielding: boolean,
  slip: boolean,
): Vec2 {
  if (nearPuck || yielding) return target
  if (slip) {
    return {
      x: target.x + error.x * 1.4,
      z: target.z + error.z * 1.4,
    }
  }
  return { x: target.x + error.x, z: target.z + error.z }
}

export function stepCpuPaddleTarget(
  playerId: PlayerId,
  current: Vec2,
  ideal: Vec2,
  delta: number,
  config: CpuConfig,
  burst: boolean,
  urgency = 0.5,
  puckX?: number,
  puckZ?: number,
  paddlePuckDist?: number,
  puckBehindPaddle = false,
) {
  const urgencyMul = 0.85 + urgency * 0.3
  let speedMul = (burst ? Math.min(1.15, config.speedFactor * 1.12) : config.speedFactor) * urgencyMul

  const nearContact =
    paddlePuckDist !== undefined &&
    paddlePuckDist < PUCK_PADDLE_MIN_DIST * 2.2
  if (!nearContact && puckX !== undefined && puckZ !== undefined) {
    const toPuck = Math.hypot(ideal.x - puckX, ideal.z - puckZ)
    if (toPuck < 0.25) speedMul *= 1.12
  }

  let goalX = ideal.x
  let goalZ = ideal.z
  if (
    !puckBehindPaddle &&
    paddlePuckDist !== undefined &&
    paddlePuckDist < 0.2
  ) {
    const smooth = 0.35
    goalX = current.x + (ideal.x - current.x) * smooth
    goalZ = current.z + (ideal.z - current.z) * smooth
  }

  const maxStep =
    getPaddleMaxSpeed(getPaddleSpeedLevel(playerId)) * speedMul * delta
  let dx = goalX - current.x
  let dz = goalZ - current.z
  const dist = Math.hypot(dx, dz)
  const stopDist =
    paddlePuckDist !== undefined && paddlePuckDist < 0.18 ? 0.012 : 0.008
  if (dist < stopDist) return
  if (dist > maxStep && dist > 1e-6) {
    dx = (dx / dist) * maxStep
    dz = (dz / dist) * maxStep
  }
  const next = clampPaddlePosition(current.x + dx, current.z + dz, playerId)
  current.x = next.x
  current.z = next.z
}
