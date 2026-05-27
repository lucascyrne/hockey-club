import { CPU_CENTER_ENGAGE_X, CPU_SLOW_PUCK_SPEED } from '../constants/cpu'
import type { PuckSample } from '../lib/puckTracker'
import { paddleTargets } from '../stores/paddleTargets'
import type { PlayerId } from './bounds'
import { clampPaddlePosition } from './bounds'
import { PADDLE_PLAY_HALF_Z } from '../constants/paddle'

export function isCenterEngageZone(puck: PuckSample): boolean {
  const speed = Math.hypot(puck.vx, puck.vz)
  return speed < CPU_SLOW_PUCK_SPEED && Math.abs(puck.x) < CPU_CENTER_ENGAGE_X
}

/** Quem deve bater no disco no centro lento (evita sanduíche). */
export function pickCenterStriker(puck: PuckSample): PlayerId {
  const d1 = Math.hypot(paddleTargets.p1.x - puck.x, paddleTargets.p1.z - puck.z)
  const d2 = Math.hypot(paddleTargets.p2.x - puck.x, paddleTargets.p2.z - puck.z)
  if (Math.abs(d1 - d2) > 0.04) return d1 <= d2 ? 1 : 2
  return puck.z >= 0 ? 2 : 1
}

/** O outro CPU recua para o lado oposto em Z e meio-campo próprio. */
export function getCenterYieldTarget(
  playerId: PlayerId,
  puck: PuckSample,
): { x: number; z: number } {
  const zSide = playerId === 2 ? 1 : -1
  const z = Math.max(
    -PADDLE_PLAY_HALF_Z,
    Math.min(PADDLE_PLAY_HALF_Z, puck.z + zSide * 0.24),
  )
  const x = playerId === 2 ? -0.38 : 0.38
  return clampPaddlePosition(x, z, playerId)
}

export function isCpuYieldingCenter(
  playerId: PlayerId,
  puck: PuckSample,
): boolean {
  if (!isCenterEngageZone(puck)) return false
  return pickCenterStriker(puck) !== playerId
}
