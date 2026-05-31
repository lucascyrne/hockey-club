import type { PuckSample } from '../../lib/puckTracker'
import type { PlayerId } from '../../systems/bounds'
import type { PerceptionSnapshot } from '../perception/types'
import {
  puckThreatensCpuGoal,
  puckThreatensP1Goal,
} from './puckPath'
import {
  tracePlayerGoalThreat,
  type GoalThreatPath,
} from './goalPath'

export type ThreatTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type ThreatAssessment = {
  score: number
  tier: ThreatTier
  critical: boolean
  goalPath: GoalThreatPath
  timeToGoal: number | null
  goalEntryZ: number | null
}

export function puckThreatensPlayerGoal(
  puck: PuckSample,
  playerId: PlayerId,
): boolean {
  return playerId === 2 ? puckThreatensCpuGoal(puck) : puckThreatensP1Goal(puck)
}

function tierFromScore(
  score: number,
  goalEntry: GoalThreatPath['goalEntry'],
  timeToGoal: number | null,
  immediate: boolean,
): ThreatTier {
  if (immediate || (goalEntry && timeToGoal !== null && timeToGoal < 0.35)) {
    return 'CRITICAL'
  }
  if (score >= 0.72 || (goalEntry && timeToGoal !== null && timeToGoal < 0.55)) {
    return 'HIGH'
  }
  if (score >= 0.38) return 'MEDIUM'
  return 'LOW'
}

export function evaluateThreat(
  snap: PerceptionSnapshot,
  playerId: PlayerId,
  horizonS: number,
  maxBounces: number,
): ThreatAssessment {
  const puck = snap.puckSample
  const immediate = puckThreatensPlayerGoal(puck, playerId)

  const goalPath = tracePlayerGoalThreat(
    puck,
    { halfX: snap.walls.halfX, halfZ: snap.walls.halfZ },
    playerId,
    Math.max(horizonS, 0.5),
    maxBounces,
  )

  const speed = Math.hypot(puck.vx, puck.vz)
  const timeToGoal = goalPath.goalEntry?.t ?? null
  const goalEntryZ = goalPath.goalEntry?.z ?? null

  let score = 0
  if (immediate) {
    score = 1
  } else if (goalPath.goalEntry) {
    const urgency = timeToGoal !== null ? Math.max(0, 1 - timeToGoal / horizonS) : 0.5
    score = 0.55 + urgency * 0.4
    if (goalPath.segmentIndex > 0) score += 0.08
  } else {
    const towardOwn =
      playerId === 2 ? puck.vx < -0.15 : puck.vx > 0.15
    if (towardOwn) score += Math.min(0.35, speed / 14)
    const mouth = snap.ownGoal.halfWidthZ * 1.15
    const last = goalPath.points[goalPath.points.length - 1]
    if (last && Math.abs(last.z) < mouth) {
      const dist = Math.abs(last.x - snap.ownGoal.lineX)
      score += Math.max(0, 0.25 - dist)
    }
  }

  score = Math.min(1, score)
  const tier = tierFromScore(score, goalPath.goalEntry, timeToGoal, immediate)

  return {
    score,
    tier,
    critical: tier === 'CRITICAL',
    goalPath,
    timeToGoal,
    goalEntryZ,
  }
}

export function threatTierAtLeast(tier: ThreatTier, min: ThreatTier): boolean {
  const order: ThreatTier[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  return order.indexOf(tier) >= order.indexOf(min)
}

export function isDefensiveThird(puck: PuckSample, playerId: PlayerId): boolean {
  return playerId === 2 ? puck.x < -0.35 : puck.x > 0.35
}
