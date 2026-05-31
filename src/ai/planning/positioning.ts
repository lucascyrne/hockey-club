import {

  CPU_ATTACK_THRESHOLD_X,

  CPU_SLOW_PUCK_SPEED,

} from '../../constants/cpu'

import { PADDLE_PLAY_HALF_Z } from '../../constants/paddle'

import type { CpuConfig } from '../config'

import { cpuMaxChaseX } from '../fsm/transitions'

import { predictPuckZ } from '../prediction/puckPath'

import {

  puckThreatensPlayerGoal,

  type ThreatAssessment,

} from '../prediction/threat'

import type { PuckSample } from '../../lib/puckTracker'

import type { PlayerId } from '../../systems/bounds'

import { clampPaddlePosition } from '../../systems/bounds'

import { applyPaddleStandoff, PUCK_PADDLE_MIN_DIST } from '../../systems/puckContact'

import { GOAL_LINE_X_NEG } from '../../systems/rules'

import { TABLE_PLAY_HALF_X, TABLE_PLAY_HALF_Z } from '../../constants/physics'

import {

  getCenterYieldTarget,

  isCenterEngageZone,

  pickCenterStriker,

} from '../../systems/cpuShared'

import type { CpuFsmState } from '../fsm/types'

import type { Vec2 } from '../types'

import type { CpuFsmContext } from '../fsm/types'
import {
  isPaddleOvershotPastPuck,
  isPuckBehindPaddle,
  mergeEngageTarget,
  updateSweepHysteresis,
} from './engageGeometry'
import {
  canRunOffense,
  isOnOwnHalf,
  planGoalFirst,
  planOffensiveStrike,
  planRemoteDefense,
  shouldGoalFirst,
  shouldOffense,
  shouldRemoteDefense,
} from './modes'



export function isPuckSlow(puck: PuckSample): boolean {

  return Math.hypot(puck.vx, puck.vz) < CPU_SLOW_PUCK_SPEED

}



function canEngagePuck(playerId: PlayerId, puck: PuckSample): boolean {

  return isOnOwnHalf(playerId, puck) || isCenterEngageZone(puck)

}



function clampZ(z: number): number {

  return Math.max(-PADDLE_PLAY_HALF_Z, Math.min(PADDLE_PLAY_HALF_Z, z))

}



export function attackPaddleX(

  puck: PuckSample,

  playerId: PlayerId,

  slow: boolean,

  config: CpuConfig,

): number {

  const offset = slow ? 0.08 : 0.05

  const maxAdvance = cpuMaxChaseX(config.attackAggression)

  const maxAdvanceSlow = Math.min(maxAdvance + 0.17, 0.08)



  if (playerId === 2) {

    const maxX = slow ? maxAdvanceSlow : maxAdvance

    return Math.max(GOAL_LINE_X_NEG + 0.12, Math.min(maxX, puck.x - offset))

  }

  return Math.min(0.94, Math.max(0.08, puck.x + offset))

}



function puckMovingTowardOwnGoal(puck: PuckSample, playerId: PlayerId): boolean {

  return playerId === 2 ? puck.vx < -0.2 : puck.vx > 0.2

}



function isPuckOnWall(puck: PuckSample): boolean {

  return (

    Math.abs(puck.z) >= TABLE_PLAY_HALF_Z - 0.035 ||

    Math.abs(puck.x) >= TABLE_PLAY_HALF_X - 0.035

  )

}



export function sweepSideZ(playerId: PlayerId, puck: PuckSample): number {

  const base = playerId === 2 ? -1 : 1

  return puck.z >= 0 ? -base : base

}



/** Apenas tutorial (attackAggression baixo). */

export function gentleReboundTarget(puck: PuckSample, config: CpuConfig): Vec2 {

  const tz = predictPuckZ(puck, Math.max(config.leadTime * 2.5, 0.12))

  const tx = Math.max(GOAL_LINE_X_NEG + 0.14, puck.x - 0.07)

  return { x: tx, z: tz }

}



export function sweepTarget(
  puck: PuckSample,
  paddle: Vec2,
  playerId: PlayerId,
  ctx: CpuFsmContext,
): Vec2 | null {
  const dist = Math.hypot(paddle.x - puck.x, paddle.z - puck.z)
  const behind = isPuckBehindPaddle(puck, paddle, playerId)
  const wantSweep =
    behind ||
    isPuckSlow(puck) ||
    dist < PUCK_PADDLE_MIN_DIST * 1.35

  if (!updateSweepHysteresis(dist, ctx, wantSweep)) return null

  if (behind) {
    const engageX = playerId === 2 ? puck.x - 0.08 : puck.x + 0.08
    return mergeEngageTarget(
      puck,
      { x: engageX, z: puck.z },
      playerId,
      paddle,
    )
  }

  if (!isPuckSlow(puck)) return null

  const overshot = isPaddleOvershotPastPuck(puck, paddle, playerId)
  const parallel =
    dist < PUCK_PADDLE_MIN_DIST * 1.15 && Math.abs(paddle.z - puck.z) < 0.06
  const nearStuck =
    dist < PUCK_PADDLE_MIN_DIST * 1.35 &&
    (isCenterEngageZone(puck) || isPuckOnWall(puck) || isPuckSlow(puck))

  if (!overshot && !parallel && !nearStuck) return null

  const dz = puck.z - paddle.z
  const side =
    Math.abs(dz) < 0.05 ? sweepSideZ(playerId, puck) : Math.sign(dz) || 1
  const retreatX = playerId === 2 ? puck.x - 0.14 : puck.x + 0.14
  return mergeEngageTarget(
    puck,
    { x: retreatX, z: clampZ(puck.z + side * 0.2) },
    playerId,
    paddle,
  )
}



/** Sombra/guia legada — recover e fallback. */

export function attackTarget(

  puck: PuckSample,

  config: CpuConfig,

  playerId: PlayerId,

): Vec2 {

  const slow = isPuckSlow(puck)

  const tx = attackPaddleX(puck, playerId, slow, config)



  let tz: number

  if (slow) {

    if (isPuckOnWall(puck) && Math.abs(puck.z) >= TABLE_PLAY_HALF_Z - 0.035) {

      tz = clampZ(puck.z - Math.sign(puck.z) * 0.12)

    } else {

      tz = clampZ(puck.z + sweepSideZ(playerId, puck) * 0.07)

    }

  } else {

    const wallTarget =

      puck.z > 0 ? -PADDLE_PLAY_HALF_Z * 0.8 : PADDLE_PLAY_HALF_Z * 0.8

    tz = clampZ(puck.z + (wallTarget - puck.z) * config.wallBias * 0.5)

  }



  return { x: tx, z: tz }

}



export type PlanInput = {
  playerId: PlayerId
  puck: PuckSample
  config: CpuConfig
  fsmState: CpuFsmState
  paddleCurrent?: Vec2
  threat: ThreatAssessment
  ownGoalLineX: number
  engageCtx: CpuFsmContext
}



export type PlanResult = {

  target: Vec2

  action: string

  interceptPoint: Vec2 | null

}



export function planPositionTarget(input: PlanInput): PlanResult {

  const {
    playerId,
    puck,
    config,
    fsmState,
    paddleCurrent,
    threat,
    ownGoalLineX,
    engageCtx,
  } = input

  if (paddleCurrent) {
    const sweep = sweepTarget(puck, paddleCurrent, playerId, engageCtx)
    if (sweep) {

      return { target: sweep, action: 'sweep', interceptPoint: null }

    }

  }



  if (shouldGoalFirst(fsmState, puck, playerId, threat)) {

    const plan = planGoalFirst(
      puck,
      playerId,
      threat,
      ownGoalLineX,
      config,
      fsmState,
      paddleCurrent,
    )

    return {

      target: plan.target,

      action: plan.action,

      interceptPoint: plan.interceptPoint,

    }

  }



  if (shouldRemoteDefense(fsmState, puck, playerId)) {

    const target = planRemoteDefense(
      puck,
      config,
      playerId,
      threat,
      paddleCurrent,
    )

    return {

      target,

      action: 'remoteDefense',

      interceptPoint: threat.goalPath.goalEntry

        ? { x: target.x, z: target.z }

        : null,

    }

  }



  if (isCenterEngageZone(puck)) {

    if (pickCenterStriker(puck) !== playerId) {

      const y = getCenterYieldTarget(playerId, puck)

      return { target: y, action: 'centerYield', interceptPoint: null }

    }

    if (

      !puckThreatensPlayerGoal(puck, playerId) &&

      !puckMovingTowardOwnGoal(puck, playerId)

    ) {

      const strike = planOffensiveStrike(puck, config, playerId)

      return {

        target: strike,

        action: 'centerStrike',

        interceptPoint: null,

      }

    }

  }



  const isTutorial = config.attackAggression < 0.35

  if (playerId === 2 && isTutorial) {

    const speed = Math.hypot(puck.vx, puck.vz)

    if (puck.x < CPU_ATTACK_THRESHOLD_X && speed < 1.35) {

      const g = gentleReboundTarget(puck, config)

      return {

        target: clampPaddlePosition(g.x, g.z, playerId),

        action: 'tutorialRebound',

        interceptPoint: null,

      }

    }

    const plan = planGoalFirst(
      puck,
      playerId,
      threat,
      ownGoalLineX,
      config,
      'guard',
      paddleCurrent,
    )

    return {

      target: plan.target,

      action: plan.action,

      interceptPoint: plan.interceptPoint,

    }

  }



  if (canRunOffense(puck, playerId, fsmState)) {

    const strike = planOffensiveStrike(puck, config, playerId)

    return {

      target: strike,

      action: 'offensiveStrike',

      interceptPoint: null,

    }

  }



  if (shouldOffense(fsmState) && canEngagePuck(playerId, puck)) {

    const strike = planOffensiveStrike(puck, config, playerId)

    return {

      target: strike,

      action: 'offensiveStrike',

      interceptPoint: null,

    }

  }



  const a = attackTarget(puck, config, playerId)

  return {

    target: clampPaddlePosition(a.x, a.z, playerId),

    action: 'defaultShadow',

    interceptPoint: null,

  }

}



export function finalizeIdealTarget(
  playerId: PlayerId,
  puck: PuckSample,
  config: CpuConfig,
  fsmState: CpuFsmState,
  ideal: Vec2,
  paddle?: Vec2,
  demoMode = false,
): Vec2 {
  const slowPuck = isPuckSlow(puck)
  const offensive =
    fsmState === 'attack' || fsmState === 'clear' || fsmState === 'pressure'
  const legacyDefend =
    fsmState === 'guard' || fsmState === 'track' || fsmState === 'intercept'
  const behind =
    paddle !== undefined && isPuckBehindPaddle(puck, paddle, playerId)
  const skipStandoff =
    behind ||
    demoMode ||
    (offensive && !slowPuck) ||
    slowPuck ||
    (playerId === 2 &&
      (!legacyDefend ||
        (config.attackAggression < 0.35 && !puckThreatensPlayerGoal(puck, 2))))

  if (skipStandoff) return ideal
  const s = applyPaddleStandoff(ideal.x, ideal.z, puck.x, puck.z, playerId)
  return { x: s.x, z: s.z }
}


