import { GOAL_HALF_WIDTH } from '../../constants/game'
import type { PuckSample } from '../../lib/puckTracker'
import { GOAL_LINE_X_NEG, GOAL_LINE_X_POS } from '../../systems/rules'
import type { Vec2 } from '../types'
import type { PuckPathPoint } from './puckPath'

export type GoalEntry = {
  x: number
  z: number
  t: number
}

export type GoalThreatPath = {
  points: PuckPathPoint[]
  goalEntry: GoalEntry | null
  /** Índice do segmento que entra no gol. */
  segmentIndex: number
  /** Horizonte usado (s). */
  horizonS: number
}

export type GoalBounds = {
  lineX: number
  halfWidthZ: number
}

export type WallBounds = {
  halfX: number
  halfZ: number
}

function reflectZ(
  z: number,
  vz: number,
  halfZ: number,
): { z: number; vz: number; tHit: number } | null {
  if (Math.abs(vz) < 1e-6) return null
  const bound = vz > 0 ? halfZ : -halfZ
  const tHit = (bound - z) / vz
  if (tHit <= 1e-6) return null
  return { z: bound, vz: -vz, tHit }
}

/** Cruza linha de gol em X com segmento (p0→p1)? */
function segmentHitsGoalLine(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  goalLineX: number,
  halfWidthZ: number,
): GoalEntry | null {
  const dx = x1 - x0
  if (Math.abs(dx) < 1e-8) return null

  const t = (goalLineX - x0) / dx
  if (t < 0 || t > 1) return null

  const z = z0 + (z1 - z0) * t
  if (Math.abs(z) > halfWidthZ) return null

  return { x: goalLineX, z, t }
}

/**
 * Traça path com rebotes em Z e deteção de entrada no gol (sem reflexão cega em X nas pontas).
 */
export function traceGoalThreatPath(
  puck: PuckSample,
  walls: WallBounds,
  ownGoal: GoalBounds,
  horizonS: number,
  maxBounces: number,
): GoalThreatPath {
  const points: PuckPathPoint[] = [{ x: puck.x, z: puck.z, t: 0 }]
  let x = puck.x
  let z = puck.z
  let vx = puck.vx
  let vz = puck.vz
  let t = 0
  let bounces = 0
  let remaining = horizonS
  let goalEntry: GoalEntry | null = null
  let segmentIndex = -1

  const goalLineX = ownGoal.lineX
  const mouth = ownGoal.halfWidthZ

  let safety = 0
  while (
    remaining > 1e-5 &&
    bounces <= maxBounces &&
    !goalEntry &&
    safety++ < 24
  ) {
    let stepT = remaining
    let willReflectZ = false
    let zHit: ReturnType<typeof reflectZ> = null

    if (Math.abs(vx) > 1e-6) {
      const tGoal = (goalLineX - x) / vx
      if (tGoal > 1e-6 && tGoal < stepT) {
        const zAt = z + vz * tGoal
        if (Math.abs(zAt) <= mouth) stepT = tGoal
      }
    }

    const hitZ = reflectZ(z, vz, walls.halfZ)
    if (hitZ && hitZ.tHit < stepT) {
      stepT = hitZ.tHit
      willReflectZ = true
      zHit = hitZ
    }

    const nx = x + vx * stepT
    const nz = z + vz * stepT

    const entry = segmentHitsGoalLine(x, z, nx, nz, goalLineX, mouth)
    if (entry) {
      const segT = t + entry.t * stepT
      points.push({ x: goalLineX, z: entry.z, t: segT })
      goalEntry = { x: goalLineX, z: entry.z, t: segT }
      segmentIndex = points.length - 2
      break
    }

    x = nx
    z = nz
    t += stepT
    remaining -= stepT
    points.push({ x, z, t })

    if (willReflectZ && zHit) {
      z = zHit.z
      vz = zHit.vz
      bounces++
    } else {
      break
    }
  }

  if (!goalEntry && remaining > 1e-5) {
    x += vx * remaining
    z += vz * remaining
    t += remaining
    points.push({
      x,
      z: Math.max(-walls.halfZ, Math.min(walls.halfZ, z)),
      t,
    })
  }

  return {
    points,
    goalEntry,
    segmentIndex,
    horizonS,
  }
}

/** Path de ameaça ao gol da CPU (P2, linha −X). */
export function traceCpuGoalThreat(
  puck: PuckSample,
  walls: WallBounds,
  horizonS: number,
  maxBounces: number,
): GoalThreatPath {
  return traceGoalThreatPath(
    puck,
    walls,
    { lineX: GOAL_LINE_X_NEG, halfWidthZ: GOAL_HALF_WIDTH },
    horizonS,
    maxBounces,
  )
}

/** Path de ameaça ao gol de P1 (+X). */
export function traceP1GoalThreat(
  puck: PuckSample,
  walls: WallBounds,
  horizonS: number,
  maxBounces: number,
): GoalThreatPath {
  return traceGoalThreatPath(
    puck,
    walls,
    { lineX: GOAL_LINE_X_POS, halfWidthZ: GOAL_HALF_WIDTH },
    horizonS,
    maxBounces,
  )
}

export function tracePlayerGoalThreat(
  puck: PuckSample,
  walls: WallBounds,
  playerId: 1 | 2,
  horizonS: number,
  maxBounces: number,
): GoalThreatPath {
  return playerId === 2
    ? traceCpuGoalThreat(puck, walls, horizonS, maxBounces)
    : traceP1GoalThreat(puck, walls, horizonS, maxBounces)
}
