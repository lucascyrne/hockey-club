import { getCpuProfile, resolveCpuConfig } from '../../lib/cpuDifficulty'
import { TABLE_PLAY_HALF_Z } from '../../constants/physics'
import { evaluateThreat } from '../prediction/threat'
import { planGoalFirstDefense } from '../planning/goalDefense'
import { planRemoteDefense } from '../planning/modes'
import { estimateOwnGoalRisk } from '../planning/safety'
import type { PerceptionSnapshot } from '../perception/types'
import { GOAL_LINE_X_NEG } from '../../systems/rules'

export type AttackScenario =
  | 'frontal'
  | 'diagonal'
  | 'singleBank'
  | 'doubleBank'
  | 'remoteBank'

export type SimOutcome = 'defended' | 'goal' | 'ownGoal' | 'miss'

export type HarnessMetrics = {
  scenario: AttackScenario
  total: number
  goalsConceded: number
  ownGoals: number
  defended: number
  avgReactionMarginMs: number
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
      position: { x: -0.5, z: 0 },
      velocity: { x: 0, z: 0 },
      playerId: 2,
      confidence: 1,
    },
    ownGoal: { lineX: GOAL_LINE_X_NEG, halfWidthZ: 0.175 },
    enemyGoal: { lineX: 0.94, halfWidthZ: 0.175 },
    walls: { halfX: 0.97, halfZ: TABLE_PLAY_HALF_Z },
    puckSample: puck,
  }
}

function scenarioPuck(kind: AttackScenario, seed: number): {
  x: number
  z: number
  vx: number
  vz: number
} {
  const r = (n: number) => ((seed * 9301 + 49297 + n * 233) % 233280) / 233280
  switch (kind) {
    case 'frontal':
      return { x: 0.4 + r(1) * 0.3, z: (r(2) - 0.5) * 0.2, vx: -5 - r(3) * 2, vz: (r(4) - 0.5) * 0.5 }
    case 'diagonal':
      return { x: 0.5, z: 0.25 + r(1) * 0.15, vx: -4, vz: -1.5 - r(2) }
    case 'singleBank':
      return { x: -0.15, z: 0.32 + r(1) * 0.08, vx: -2.5 - r(2), vz: -2.8 - r(3) }
    case 'doubleBank':
      return { x: 0.1 + r(1) * 0.2, z: -0.35, vx: -3.5, vz: 2.5 + r(2) }
    case 'remoteBank':
      return {
        x: 0.45 + r(1) * 0.25,
        z: 0.2 + (r(2) - 0.5) * 0.3,
        vx: -1.2 - r(3) * 0.8,
        vz: (r(4) - 0.5) * 1.2,
      }
  }
}

function classifyOutcome(
  threat: ReturnType<typeof evaluateThreat>,
  target: { x: number; z: number },
  puck: { x: number; z: number; vx: number; vz: number },
): SimOutcome {
  const og = estimateOwnGoalRisk(puck, target, 2)
  if (og >= 0.42) return 'ownGoal'

  const entryZ = threat.goalEntryZ ?? threat.goalPath.goalEntry?.z
  if (threat.goalPath.goalEntry && threat.tier !== 'LOW' && entryZ != null) {
    const blocksMouth =
      Math.abs(target.z - entryZ) < 0.12 &&
      target.x >= GOAL_LINE_X_NEG + 0.1 &&
      target.x <= -0.35
    if (blocksMouth && (threat.tier === 'HIGH' || threat.tier === 'CRITICAL')) {
      return 'defended'
    }
    if (threat.timeToGoal !== null && threat.timeToGoal < 0.4) {
      return 'goal'
    }
  }

  if (threat.goalPath.goalEntry) return 'goal'
  return 'miss'
}

export function runDefenseSuite(
  scenario: AttackScenario,
  count: number,
  difficulty: 1 | 2 | 3 = 3,
): HarnessMetrics {
  const profile = getCpuProfile(difficulty)
  const config = resolveCpuConfig(difficulty, profile)

  let goalsConceded = 0
  let ownGoals = 0
  let defended = 0
  let marginSum = 0
  let marginN = 0

  for (let i = 0; i < count; i++) {
    const puck = scenarioPuck(scenario, i)
    const snap = makeSnap(puck)
    const threat = evaluateThreat(snap, 2, config.predictionHorizonS, config.maxBounceReflections)
    const plan =
      scenario === 'remoteBank'
        ? {
            target: planRemoteDefense(puck, config, 2, threat),
            action: 'remoteDefense',
          }
        : planGoalFirstDefense(
            puck,
            2,
            threat,
            GOAL_LINE_X_NEG,
            config,
            threat.tier,
          )
    const outcome = classifyOutcome(threat, plan.target, puck)

    if (outcome === 'goal') goalsConceded++
    else if (outcome === 'ownGoal') ownGoals++
    else if (outcome === 'defended') defended++
    else defended++

    if (threat.timeToGoal !== null && threat.tier !== 'LOW') {
      marginSum += Math.max(0, threat.timeToGoal * 1000 - profile.reactionMs)
      marginN++
    }
  }

  return {
    scenario,
    total: count,
    goalsConceded,
    ownGoals,
    defended,
    avgReactionMarginMs: marginN > 0 ? marginSum / marginN : 0,
  }
}

export function runFullDefenseHarness(samplesPerSuite = 250): HarnessMetrics[] {
  const scenarios: AttackScenario[] = [
    'frontal',
    'diagonal',
    'singleBank',
    'doubleBank',
    'remoteBank',
  ]
  return scenarios.map((s) => runDefenseSuite(s, samplesPerSuite))
}
