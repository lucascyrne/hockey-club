import { describe, expect, it } from 'vitest'
import { GOAL_HALF_WIDTH } from '../../constants/game'
import { TABLE_PLAY_HALF_Z } from '../../constants/physics'
import { GOAL_LINE_X_NEG } from '../../systems/rules'
import { traceCpuGoalThreat } from './goalPath'

const walls = { halfX: 0.97, halfZ: TABLE_PLAY_HALF_Z }

describe('traceCpuGoalThreat', () => {
  it('deteta remate frontal na boca do gol', () => {
    const puck = { x: 0.25, z: 0.05, vx: -5, vz: 0.1 }
    const path = traceCpuGoalThreat(puck, walls, 0.5, 0)
    expect(path.goalEntry).not.toBeNull()
    expect(path.goalEntry!.x).toBeCloseTo(GOAL_LINE_X_NEG, 2)
    expect(Math.abs(path.goalEntry!.z)).toBeLessThanOrEqual(GOAL_HALF_WIDTH)
  })

  it('tabela simples produz path com rebote Z', () => {
    const puck = { x: 0.15, z: 0.36, vx: -4, vz: -2.8 }
    const path = traceCpuGoalThreat(puck, walls, 0.7, 2)
    expect(path.points.length).toBeGreaterThan(2)
  })

  it('diagonal para fora não entra no gol', () => {
    const puck = { x: 0.3, z: 0.3, vx: 2, vz: 1 }
    const path = traceCpuGoalThreat(puck, walls, 0.5, 1)
    expect(path.goalEntry).toBeNull()
  })

  it('double bank pode prever entrada com 2 rebotes', () => {
    const puck = {
      x: 0.15,
      z: -0.38,
      vx: -3,
      vz: 2.8,
    }
    const path = traceCpuGoalThreat(puck, walls, 0.8, 2)
    expect(path.points.length).toBeGreaterThan(2)
  })
})
