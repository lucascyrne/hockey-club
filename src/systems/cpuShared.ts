import { CPU_CENTER_ENGAGE_X, CPU_SLOW_PUCK_SPEED } from '../constants/cpu'
import { getPaddlePosition } from '../lib/paddlePositionRegistry'
import type { PuckSample } from '../lib/puckTracker'
import type { PlayerId } from './bounds'
import { clampPaddlePosition } from './bounds'
import { PADDLE_PLAY_HALF_Z } from '../constants/paddle'

export function isCenterEngageZone(puck: PuckSample): boolean {
  const speed = Math.hypot(puck.vx, puck.vz)
  return speed < CPU_SLOW_PUCK_SPEED && Math.abs(puck.x) < CPU_CENTER_ENGAGE_X
}

/** Quem deve bater no disco no centro lento — usa posição renderizada (fair play). */
export function pickCenterStriker(puck: PuckSample): PlayerId {
  const p1 = getPaddlePosition(1)
  const p2 = getPaddlePosition(2)
  const d1 = Math.hypot(p1.x - puck.x, p1.z - puck.z)
  const d2 = Math.hypot(p2.x - puck.x, p2.z - puck.z)
  if (Math.abs(d1 - d2) > 0.04) return d1 <= d2 ? 1 : 2
  return puck.z >= 0 ? 2 : 1
}

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

const DEMO_BOTH_NEAR_DIST = 0.2

export function isCpuYieldingCenter(
  playerId: PlayerId,
  puck: PuckSample,
  demoMode = false,
): boolean {
  if (demoMode) {
    const p1 = getPaddlePosition(1)
    const p2 = getPaddlePosition(2)
    const d1 = Math.hypot(p1.x - puck.x, p1.z - puck.z)
    const d2 = Math.hypot(p2.x - puck.x, p2.z - puck.z)
    if (d1 < DEMO_BOTH_NEAR_DIST && d2 < DEMO_BOTH_NEAR_DIST) {
      return pickCenterStriker(puck) !== playerId
    }
  }
  if (!isCenterEngageZone(puck)) return false
  return pickCenterStriker(puck) !== playerId
}
