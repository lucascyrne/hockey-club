import { CPU_THREAT_LEAD_S } from '../../constants/cpu'
import { GOAL_HALF_WIDTH } from '../../constants/game'
import { TABLE_PLAY_HALF_X, TABLE_PLAY_HALF_Z } from '../../constants/physics'
import type { PuckSample } from '../../lib/puckTracker'
import { GOAL_LINE_X_NEG, GOAL_LINE_X_POS } from '../../systems/rules'
import type { Vec2 } from '../types'

export { CPU_THREAT_LEAD_S }

export type PuckPathPoint = Vec2 & { t: number }

export type PredictedPuckPath = {
  points: PuckPathPoint[]
  /** Position at lead horizon (last point or linear extrapolation). */
  atHorizon: Vec2
  threatLeadX: number
}

function clampZ(z: number, halfZ: number): number {
  return Math.max(-halfZ, Math.min(halfZ, z))
}

/** Linear position after `leadS` seconds (no wall bounce). */
export function predictLinear(
  puck: PuckSample,
  leadS: number,
  halfZ = TABLE_PLAY_HALF_Z,
): Vec2 {
  return {
    x: puck.x + puck.vx * leadS,
    z: clampZ(puck.z + puck.vz * leadS, halfZ),
  }
}

/** Legacy Z tracking — same as predictLinear Z with play bounds. */
export function predictPuckZ(puck: PuckSample, leadS: number): number {
  return predictLinear(puck, leadS).z
}

/** Predicted X at threat horizon (goal danger). */
export function predictThreatX(
  puck: PuckSample,
  leadS = CPU_THREAT_LEAD_S,
): number {
  return puck.x + puck.vx * leadS
}

function reflectAxis(
  pos: number,
  vel: number,
  bound: number,
): { pos: number; vel: number; tHit: number } | null {
  if (Math.abs(vel) < 1e-6) return null
  const toWall = vel > 0 ? bound - pos : -bound - pos
  const tHit = toWall / vel
  if (tHit <= 0) return null
  return {
    pos: vel > 0 ? bound : -bound,
    vel: -vel,
    tHit,
  }
}

/** Piecewise linear path with up to `maxBounces` specular wall reflections. */
export function buildPuckPath(
  puck: PuckSample,
  horizonS: number,
  maxBounces: number,
  halfX = TABLE_PLAY_HALF_X,
  halfZ = TABLE_PLAY_HALF_Z,
): PredictedPuckPath {
  const points: PuckPathPoint[] = [{ x: puck.x, z: puck.z, t: 0 }]
  let x = puck.x
  let z = puck.z
  let vx = puck.vx
  let vz = puck.vz
  let t = 0
  let bounces = 0
  let remaining = horizonS

  while (remaining > 1e-5 && bounces <= maxBounces) {
    let bestT = remaining
    let axis: 'x' | 'z' | null = null

    const hitX = reflectAxis(x, vx, halfX)
    if (hitX && hitX.tHit < bestT) {
      bestT = hitX.tHit
      axis = 'x'
    }
    const hitZ = reflectAxis(z, vz, halfZ)
    if (hitZ && hitZ.tHit < bestT) {
      bestT = hitZ.tHit
      axis = 'z'
    }

    x += vx * bestT
    z += vz * bestT
    t += bestT
    remaining -= bestT
    points.push({ x, z, t })

    if (axis === 'x' && hitX) {
      x = hitX.pos
      vx = hitX.vel
      bounces++
    } else if (axis === 'z' && hitZ) {
      z = hitZ.pos
      vz = hitZ.vel
      bounces++
    } else {
      break
    }
  }

  if (remaining > 1e-5) {
    x += vx * remaining
    z += vz * remaining
    t += remaining
    points.push({ x, z: clampZ(z, halfZ), t })
  }

  const last = points[points.length - 1]
  return {
    points,
    atHorizon: { x: last.x, z: last.z },
    threatLeadX: predictThreatX(puck),
  }
}

/** Disco a caminho do gol da CPU (−X). */
export function puckThreatensCpuGoal(puck: PuckSample): boolean {
  const speed = Math.hypot(puck.vx, puck.vz)
  const inMouth = Math.abs(puck.z) < GOAL_HALF_WIDTH * 1.15
  const predX = predictThreatX(puck)

  if (puck.x <= GOAL_LINE_X_NEG + 0.08 && inMouth) return true
  if (inMouth && puck.x < -0.38 && puck.vx < -0.12) return true
  if (predX < -0.62 && puck.vx < -0.25) return true
  if (puck.x < -0.2 && puck.vx < -0.55 && speed > 0.8) return true
  if (puck.x < 0.05 && puck.vx < -1.2) return true

  return false
}

/** Disco a caminho do gol de P1 (+X). */
export function puckThreatensP1Goal(puck: PuckSample): boolean {
  const speed = Math.hypot(puck.vx, puck.vz)
  const inMouth = Math.abs(puck.z) < GOAL_HALF_WIDTH * 1.15
  const predX = predictThreatX(puck)

  if (puck.x >= GOAL_LINE_X_POS - 0.08 && inMouth) return true
  if (inMouth && puck.x > 0.38 && puck.vx > 0.12) return true
  if (predX > 0.62 && puck.vx > 0.25) return true
  if (puck.x > 0.2 && puck.vx > 0.55 && speed > 0.8) return true
  if (puck.x > -0.05 && puck.vx > 1.2) return true

  return false
}
