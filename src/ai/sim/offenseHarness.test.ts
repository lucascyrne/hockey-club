import { describe, expect, it } from 'vitest'
import { getCpuProfile, resolveCpuConfig } from '../../lib/cpuDifficulty'
import { planOffensiveStrike, planRemoteDefense } from '../planning/modes'
import { evaluateThreat } from '../prediction/threat'
import { TABLE_PLAY_HALF_Z } from '../../constants/physics'
import { GOAL_LINE_X_NEG } from '../../systems/rules'
import type { PerceptionSnapshot } from '../perception/types'
import { runOffenseSuite } from './offenseHarness'

function remoteSnap(puck: {
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

describe('offenseHarness', () => {
  it('strike target is through puck toward enemy goal (P2)', () => {
    const profile = getCpuProfile(2)
    const config = resolveCpuConfig(2, profile)
    const puck = { x: -0.3, z: 0.12, vx: 0.6, vz: 0.1 }
    const target = planOffensiveStrike(puck, config, 2)
    expect(target.x).toBeGreaterThan(puck.x + 0.06)
  })

  it('suite reports majority through-puck strikes', () => {
    const m = runOffenseSuite(40, 2)
    expect(m.throughPuck).toBeGreaterThan(m.total * 0.8)
  })
})

describe('remoteDefense', () => {
  it('uses goalEntryZ when bank path threatens goal', () => {
    const profile = getCpuProfile(3)
    const config = resolveCpuConfig(3, profile)
    const puck = { x: 0.5, z: 0.22, vx: -2, vz: -1.5 }
    const snap = remoteSnap(puck)
    const threat = evaluateThreat(snap, 2, config.predictionHorizonS, config.maxBounceReflections)
    const target = planRemoteDefense(puck, config, 2, threat)
    const entryZ = threat.goalEntryZ ?? threat.goalPath.goalEntry?.z
    if (entryZ != null) {
      expect(Math.abs(target.z - entryZ)).toBeLessThan(0.2)
    }
    expect(target.x).toBeLessThanOrEqual(-0.35)
  })
})
