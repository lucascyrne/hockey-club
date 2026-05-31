import { getCpuProfile, resolveCpuConfig } from '../../lib/cpuDifficulty'
import { TABLE_PLAY_HALF_Z } from '../../constants/physics'
import { evaluateThreat } from '../prediction/threat'
import { planOffensiveStrike } from '../planning/modes'
import { createCpuFsmContext } from '../fsm/types'
import { planPositionTarget } from '../planning/positioning'
import type { PerceptionSnapshot } from '../perception/types'
import { GOAL_LINE_X_NEG, GOAL_LINE_X_POS } from '../../systems/rules'

export type OffenseMetrics = {
  total: number
  throughPuck: number
  towardEnemyGoal: number
}

function makeSnap(puck: {
  x: number
  z: number
  vx: number
  vz: number
}): PerceptionSnapshot {
  return {
    timestamp: 0,
    puck: {
      position: { x: puck.x, z: puck.z },
      velocity: { x: puck.vx, z: puck.vz },
      ageMs: 0,
      confidence: 1,
    },
    self: {
      position: { x: -0.35, z: 0 },
      velocity: { x: 0, z: 0 },
      playerId: 2,
      confidence: 1,
    },
    ownGoal: { lineX: GOAL_LINE_X_NEG, halfWidthZ: 0.175 },
    enemyGoal: { lineX: GOAL_LINE_X_POS, halfWidthZ: 0.175 },
    walls: { halfX: 0.97, halfZ: TABLE_PLAY_HALF_Z },
    puckSample: puck,
  }
}

export function runOffenseSuite(count: number, difficulty: 1 | 2 | 3 = 2): OffenseMetrics {
  const profile = getCpuProfile(difficulty)
  const config = resolveCpuConfig(difficulty, profile)

  let throughPuck = 0
  let towardEnemyGoal = 0

  for (let i = 0; i < count; i++) {
    const puck = {
      x: -0.25 - (i % 5) * 0.04,
      z: ((i % 7) - 3) * 0.06,
      vx: 0.4 + (i % 3) * 0.2,
      vz: (i % 2 === 0 ? 1 : -1) * 0.15,
    }

    const strike = planOffensiveStrike(puck, config, 2)
    if (strike.x > puck.x + 0.04) throughPuck++
    if (strike.x > puck.x + 0.02) towardEnemyGoal++

    const snap = makeSnap(puck)
    const threat = evaluateThreat(snap, 2, config.predictionHorizonS, config.maxBounceReflections)
    const plan = planPositionTarget({
      playerId: 2,
      puck,
      config,
      fsmState: 'attack',
      threat,
      ownGoalLineX: GOAL_LINE_X_NEG,
      engageCtx: createCpuFsmContext(),
    })
    if (plan.action === 'offensiveStrike' && plan.target.x > puck.x + 0.04) {
      throughPuck++
    }
  }

  return {
    total: count,
    throughPuck,
    towardEnemyGoal,
  }
}
