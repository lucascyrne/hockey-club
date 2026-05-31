import { GOAL_HALF_WIDTH } from '../../constants/game'
import {
  CPU_ATTACK_THRESHOLD_X,
  CPU_DEFENSE_X,
} from '../../constants/cpu'
import { PADDLE_PLAY_HALF_Z } from '../../constants/paddle'
import type { CpuConfig } from '../config'
import type { CpuFsmState } from '../fsm/types'
import { predictPuckZ } from '../prediction/puckPath'
import {
  isDefensiveThird,
  puckThreatensPlayerGoal,
  threatTierAtLeast,
  type ThreatAssessment,
} from '../prediction/threat'
import type { PuckSample } from '../../lib/puckTracker'
import type { PlayerId } from '../../systems/bounds'
import { clampPaddlePosition } from '../../systems/bounds'
import { GOAL_LINE_X_NEG, GOAL_LINE_X_POS } from '../../systems/rules'
import type { Vec2 } from '../types'
import { mergeEngageTarget } from './engageGeometry'
import { planGoalFirstDefense, type GoalDefensePlan } from './goalDefense'

const P1_DEFENSE_X = -CPU_DEFENSE_X
const P1_ATTACK_THRESHOLD_X = -CPU_ATTACK_THRESHOLD_X

function clampZ(z: number): number {
  return Math.max(-PADDLE_PLAY_HALF_Z, Math.min(PADDLE_PLAY_HALF_Z, z))
}

export function isOnOwnHalf(playerId: PlayerId, puck: PuckSample): boolean {
  return playerId === 2
    ? puck.x < CPU_ATTACK_THRESHOLD_X
    : puck.x > P1_ATTACK_THRESHOLD_X
}

/** intercept / guard com ameaça real ao nosso gol — não inclui track remoto. */
export function shouldGoalFirst(
  fsmState: CpuFsmState,
  puck: PuckSample,
  playerId: PlayerId,
  threat: ThreatAssessment,
): boolean {
  if (fsmState === 'intercept') return true
  if (puckThreatensPlayerGoal(puck, playerId)) return true
  if (threatTierAtLeast(threat.tier, 'HIGH')) return true
  if (fsmState === 'guard') {
    return (
      threatTierAtLeast(threat.tier, 'MEDIUM') ||
      isDefensiveThird(puck, playerId) ||
      threat.goalPath.goalEntry !== null
    )
  }
  return false
}

/** Disco no campo adversário, ameaça baixa/média sem pressão imediata. */
export function shouldRemoteDefense(
  fsmState: CpuFsmState,
  puck: PuckSample,
  playerId: PlayerId,
): boolean {
  return fsmState === 'track' && !isOnOwnHalf(playerId, puck)
}

export function shouldOffense(fsmState: CpuFsmState): boolean {
  return fsmState === 'attack' || fsmState === 'clear' || fsmState === 'pressure'
}

function puckMovingTowardOwnGoal(puck: PuckSample, playerId: PlayerId): boolean {
  return playerId === 2 ? puck.vx < -0.2 : puck.vx > 0.2
}

function strikeOvershootM(config: CpuConfig): number {
  return Math.min(0.18, 0.06 + config.attackAggression * 0.2)
}

/** Alvo através do disco em direção ao gol adversário. */
export function planOffensiveStrike(
  puck: PuckSample,
  config: CpuConfig,
  playerId: PlayerId,
): Vec2 {
  const overshoot = strikeOvershootM(config)
  const mouth = GOAL_HALF_WIDTH * 0.55
  const openZ = puck.z >= 0 ? -mouth : mouth

  if (playerId === 2) {
    const tx = Math.min(GOAL_LINE_X_POS - 0.08, puck.x + overshoot)
    const tz = clampZ(puck.z + (openZ - puck.z) * 0.65)
    return clampPaddlePosition(tx, tz, playerId)
  }

  const tx = Math.max(GOAL_LINE_X_NEG + 0.08, puck.x - overshoot)
  const tz = clampZ(puck.z + (openZ - puck.z) * 0.65)
  return clampPaddlePosition(tx, tz, playerId)
}

/** Defesa com disco longe: fecha Z na entrada prevista ao gol. */
export function planRemoteDefense(
  puck: PuckSample,
  config: CpuConfig,
  playerId: PlayerId,
  threat: ThreatAssessment,
  paddle?: Vec2,
): Vec2 {
  const leadS = Math.max(config.leadTime * 2.2, config.predictionHorizonS * 0.5)
  const shadowZ =
    threat.goalEntryZ ??
    threat.goalPath.goalEntry?.z ??
    predictPuckZ(puck, leadS)

  let tx: number
  if (playerId === 2) {
    const urgent =
      threat.goalPath.goalEntry !== null &&
      threat.timeToGoal !== null &&
      threat.timeToGoal < 0.55
    tx = urgent
      ? Math.min(CPU_DEFENSE_X + 0.12, CPU_DEFENSE_X * 0.7 + puck.x * 0.3)
      : CPU_DEFENSE_X
    return mergeEngageTarget(puck, { x: tx, z: clampZ(shadowZ) }, playerId, paddle)
  }

  const urgent =
    threat.goalPath.goalEntry !== null &&
    threat.timeToGoal !== null &&
    threat.timeToGoal < 0.55
  tx = urgent
    ? Math.max(P1_DEFENSE_X - 0.12, P1_DEFENSE_X * 0.7 + puck.x * 0.3)
    : P1_DEFENSE_X
  return mergeEngageTarget(puck, { x: tx, z: clampZ(shadowZ) }, playerId, paddle)
}

export function planGoalFirst(
  puck: PuckSample,
  playerId: PlayerId,
  threat: ThreatAssessment,
  ownGoalLineX: number,
  config: CpuConfig,
  fsmState: CpuFsmState,
  paddle?: Vec2,
): GoalDefensePlan {
  const tier =
    fsmState === 'intercept' || puckThreatensPlayerGoal(puck, playerId)
      ? 'CRITICAL'
      : threat.tier
  return planGoalFirstDefense(
    puck,
    playerId,
    threat,
    ownGoalLineX,
    config,
    tier,
    paddle,
  )
}

export function canRunOffense(
  puck: PuckSample,
  playerId: PlayerId,
  fsmState: CpuFsmState,
): boolean {
  if (!shouldOffense(fsmState)) return false
  if (puckMovingTowardOwnGoal(puck, playerId)) return false
  const towardEnemy = playerId === 2 ? puck.vx > -0.15 : puck.vx < 0.15
  return towardEnemy
}
