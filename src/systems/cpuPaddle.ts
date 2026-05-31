/** @deprecated Import from `src/ai` — re-exports for backward compatibility. */
export {
  planPositionTarget,
  finalizeIdealTarget,
  attackTarget,
  isPuckSlow,
} from '../ai/planning/positioning'

export { stepCpuPaddleTarget } from '../ai/actuation/actuator'

import type { CpuDifficulty, CpuProfile } from '../lib/cpuDifficulty'
import { resolveCpuConfig } from '../ai/config'
import { createCpuFsmContext, type CpuLegacyMode } from '../ai/fsm/types'
import type { CpuFsmState } from '../ai/fsm/types'
import type { PuckSample } from '../lib/puckTracker'
import { GOAL_LINE_X_NEG, GOAL_LINE_X_POS } from './rules'
import type { PlayerId } from './bounds'
import {
  finalizeIdealTarget,
  planPositionTarget,
} from '../ai/planning/positioning'
import { evaluateThreat } from '../ai/prediction/threat'
import { TABLE_PLAY_HALF_X, TABLE_PLAY_HALF_Z } from '../constants/physics'
import { GOAL_HALF_WIDTH } from '../constants/game'

function legacyModeToFsm(mode: CpuLegacyMode): CpuFsmState {
  switch (mode) {
    case 'press':
      return 'clear'
    case 'attack':
      return 'attack'
    default:
      return 'guard'
  }
}

export function computeCpuIdealTarget(
  playerId: PlayerId,
  puck: PuckSample,
  profile: CpuProfile,
  mode: CpuLegacyMode = 'defend',
  paddleCurrent?: { x: number; z: number },
  difficulty: CpuDifficulty = 3,
): { x: number; z: number } {
  const config = resolveCpuConfig(difficulty, profile)
  const fsm = legacyModeToFsm(mode)
  const ownGoalLineX = playerId === 2 ? GOAL_LINE_X_NEG : GOAL_LINE_X_POS
  const snap = {
    timestamp: 0,
    puck: {
      position: { x: puck.x, z: puck.z },
      velocity: { x: puck.vx, z: puck.vz },
      ageMs: 0,
      confidence: 1,
    },
    self: { position: { x: 0, z: 0 }, velocity: { x: 0, z: 0 }, playerId, confidence: 1 },
    ownGoal: { lineX: ownGoalLineX, halfWidthZ: GOAL_HALF_WIDTH },
    enemyGoal: { lineX: playerId === 2 ? GOAL_LINE_X_POS : GOAL_LINE_X_NEG, halfWidthZ: GOAL_HALF_WIDTH },
    walls: { halfX: TABLE_PLAY_HALF_X, halfZ: TABLE_PLAY_HALF_Z },
    puckSample: puck,
  }
  const threat = evaluateThreat(
    snap,
    playerId,
    config.predictionHorizonS,
    config.maxBounceReflections,
  )
  const plan = planPositionTarget({
    playerId,
    puck,
    config,
    fsmState: fsm,
    paddleCurrent,
    threat,
    ownGoalLineX,
    engageCtx: createCpuFsmContext(),
  })
  return finalizeIdealTarget(
    playerId,
    puck,
    config,
    fsm,
    plan.target,
    paddleCurrent,
  )
}
