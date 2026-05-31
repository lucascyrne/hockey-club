import { GOAL_HALF_WIDTH } from '../../constants/game'
import { CPU_CENTER_ENGAGE_X } from '../../constants/cpu'

import type { PuckSample } from '../../lib/puckTracker'

import type { PlayerId } from '../../systems/bounds'

import { GOAL_LINE_X_NEG, GOAL_LINE_X_POS } from '../../systems/rules'

import type { CpuFsmState } from '../fsm/types'

import {

  isDefensiveThird,

  puckThreatensPlayerGoal,

  threatTierAtLeast,

  type ThreatAssessment,

} from '../prediction/threat'

import type { Vec2 } from '../types'

import { goalMouthBlockTarget } from './goalDefense'



const OWN_GOAL_RISK_THRESHOLD = 0.42



function isDefensiveFsm(state: CpuFsmState): boolean {

  return state === 'guard' || state === 'track' || state === 'intercept'

}



/** Estima risco de gol contra (vetor alvo→disco, impulso simulado). */

export function estimateOwnGoalRisk(

  puck: PuckSample,

  target: Vec2,

  playerId: PlayerId,

): number {

  const goalLineX = playerId === 2 ? GOAL_LINE_X_NEG : GOAL_LINE_X_POS



  let dx = puck.x - target.x

  let dz = puck.z - target.z

  const len = Math.hypot(dx, dz)

  if (len < 1e-5) return 0

  dx /= len

  dz /= len



  const impulse = 5.5

  const predX = puck.x + dx * impulse * 0.1

  const predZ = puck.z + dz * impulse * 0.1



  let risk = 0

  const inMouth = Math.abs(predZ) < GOAL_HALF_WIDTH * 1.1



  if (playerId === 2) {

    if (predX < goalLineX + 0.05 && inMouth && dx < 0) risk = 0.9

    else if (dx < -0.15 && puck.x < -0.2 && inMouth) risk = 0.5

  } else {

    if (predX > goalLineX - 0.05 && inMouth && dx > 0) risk = 0.9

    else if (dx > 0.15 && puck.x > 0.2 && inMouth) risk = 0.5

  }



  return Math.min(1, risk)

}



export function pickSafeTarget(

  puck: PuckSample,

  primary: Vec2,

  threat: ThreatAssessment,

  playerId: PlayerId,

  ownGoalLineX: number,

  fsmState: CpuFsmState,

  demoMode = false,

): { target: Vec2; ownGoalRisk: number; usedFallback: boolean } {

  const primaryRisk = estimateOwnGoalRisk(puck, primary, playerId)

  if (
    demoMode &&
    Math.abs(puck.x) < CPU_CENTER_ENGAGE_X &&
    !puckThreatensPlayerGoal(puck, playerId)
  ) {
    return { target: primary, ownGoalRisk: primaryRisk, usedFallback: false }
  }

  const applySafety =

    isDefensiveThird(puck, playerId) ||

    isDefensiveFsm(fsmState) ||

    threatTierAtLeast(threat.tier, 'MEDIUM')



  if (!applySafety || primaryRisk < OWN_GOAL_RISK_THRESHOLD) {

    return { target: primary, ownGoalRisk: primaryRisk, usedFallback: false }

  }



  const safe = goalMouthBlockTarget(threat, playerId, ownGoalLineX, puck)

  const safeRisk = estimateOwnGoalRisk(puck, safe, playerId)

  if (safeRisk < primaryRisk) {

    return { target: safe, ownGoalRisk: safeRisk, usedFallback: true }

  }



  return { target: primary, ownGoalRisk: primaryRisk, usedFallback: false }

}



export { OWN_GOAL_RISK_THRESHOLD }

