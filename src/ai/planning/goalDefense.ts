import { CPU_DEFENSE_X } from '../../constants/cpu'
import { PADDLE_PLAY_HALF_Z } from '../../constants/paddle'
import type { CpuConfig } from '../config'
import type { GoalThreatPath } from '../prediction/goalPath'
import type { ThreatAssessment, ThreatTier } from '../prediction/threat'
import type { PuckSample } from '../../lib/puckTracker'
import type { PlayerId } from '../../systems/bounds'
import { clampPaddlePosition } from '../../systems/bounds'
import { GOAL_LINE_X_NEG } from '../../systems/rules'
import type { Vec2 } from '../types'
import { mergeEngageTarget } from './engageGeometry'

const GOAL_GUARD_PAD_X = 0.14
const P1_DEFENSE_X = -CPU_DEFENSE_X

function clampZ(z: number): number {
  return Math.max(-PADDLE_PLAY_HALF_Z, Math.min(PADDLE_PLAY_HALF_Z, z))
}

/** Bloqueio na boca do gol (Goal-first). */
export function goalMouthBlockTarget(
  threat: ThreatAssessment,
  playerId: PlayerId,
  ownGoalLineX: number,
  puck: PuckSample,
  paddle?: Vec2,
): Vec2 {
  const z =
    threat.goalEntryZ ??
    threat.goalPath.goalEntry?.z ??
    threat.goalPath.points[threat.goalPath.points.length - 1]?.z ??
    0

  if (playerId === 2) {
    let tx = Math.max(GOAL_LINE_X_NEG + GOAL_GUARD_PAD_X, ownGoalLineX + GOAL_GUARD_PAD_X)
    if (puck.x >= CPU_DEFENSE_X - 0.08) {
      tx = Math.min(CPU_DEFENSE_X, tx)
    }
    return mergeEngageTarget(puck, { x: tx, z: clampZ(z) }, playerId, paddle)
  }

  let tx = Math.min(-P1_DEFENSE_X, ownGoalLineX - GOAL_GUARD_PAD_X)
  if (puck.x <= P1_DEFENSE_X + 0.08) {
    tx = Math.max(P1_DEFENSE_X, tx)
  }
  return mergeEngageTarget(puck, { x: tx, z: clampZ(z) }, playerId, paddle)
}

/** Ponto de intercepto no segmento que entra no gol. */
export function computeInterceptPoint(
  path: GoalThreatPath,
  playerId: PlayerId,
  puck: PuckSample,
  paddle?: Vec2,
): Vec2 | null {
  const entry = path.goalEntry
  if (!entry || path.points.length < 2) return null

  const idx = Math.max(0, path.segmentIndex)
  const a = path.points[idx]
  const b = path.points[idx + 1] ?? path.points[path.points.length - 1]
  if (!a || !b) return null

  const t = entry.t > a.t ? 0.35 : 0.5
  const ix = a.x + (b.x - a.x) * t
  const iz = a.z + (b.z - a.z) * t

  if (playerId === 2) {
    const raw = {
      x: Math.max(GOAL_LINE_X_NEG + GOAL_GUARD_PAD_X, ix - 0.06),
      z: clampZ(iz),
    }
    return mergeEngageTarget(puck, raw, playerId, paddle)
  }

  const raw = {
    x: Math.max(P1_DEFENSE_X, ix + 0.06),
    z: clampZ(iz),
  }
  return mergeEngageTarget(puck, raw, playerId, paddle)
}

export type GoalDefensePlan = {
  target: Vec2
  interceptPoint: Vec2 | null
  action: string
}

export function planGoalFirstDefense(
  puck: PuckSample,
  playerId: PlayerId,
  threat: ThreatAssessment,
  ownGoalLineX: number,
  config: CpuConfig,
  tier: ThreatTier,
  paddle?: Vec2,
): GoalDefensePlan {
  const mouth = goalMouthBlockTarget(threat, playerId, ownGoalLineX, puck, paddle)
  const intercept = computeInterceptPoint(threat.goalPath, playerId, puck, paddle)

  if (tier === 'CRITICAL' || tier === 'HIGH') {
    const target = intercept ?? mouth
    return {
      target: clampPaddlePosition(target.x, target.z, playerId),
      interceptPoint: intercept,
      action: intercept ? 'goalIntercept' : 'goalMouth',
    }
  }

  if (tier === 'MEDIUM' && threat.goalPath.goalEntry) {
    const blend = clampPaddlePosition(
      mouth.x * 0.55 + (intercept?.x ?? mouth.x) * 0.45,
      mouth.z,
      playerId,
    )
    return {
      target: blend,
      interceptPoint: intercept,
      action: 'goalShadow',
    }
  }

  const shadowZ = threat.goalEntryZ ?? puck.z
  const blendX =
    playerId === 2
      ? CPU_DEFENSE_X * config.defenseWeight + puck.x * (1 - config.defenseWeight)
      : P1_DEFENSE_X * config.defenseWeight + puck.x * (1 - config.defenseWeight)

  const target = mergeEngageTarget(
    puck,
    { x: blendX, z: clampZ(shadowZ) },
    playerId,
    paddle,
  )

  return {
    target,
    interceptPoint: intercept,
    action: 'track',
  }
}
