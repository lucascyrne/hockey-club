import { describe, expect, it } from 'vitest'
import {
  buildPuckPath,
  predictLinear,
  predictPuckZ,
  predictThreatX,
  puckThreatensCpuGoal,
} from './puckPath'

describe('predictLinear', () => {
  it('extrapolates position on Z with clamp', () => {
    const p = { x: 0, z: 0, vx: 0, vz: 2 }
    const at = predictLinear(p, 0.1, 0.5)
    expect(at.z).toBe(0.2)
    expect(at.x).toBe(0)
  })
})

describe('predictPuckZ', () => {
  it('matches legacy predictedZ behavior', () => {
    const p = { x: -0.3, z: 0.1, vx: -1, vz: 0.5 }
    expect(predictPuckZ(p, 0.1)).toBeCloseTo(0.15, 5)
  })
})

describe('predictThreatX', () => {
  it('uses default threat horizon', () => {
    const p = { x: 0, z: 0, vx: -2, vz: 0 }
    expect(predictThreatX(p)).toBeCloseTo(-0.9, 5)
  })
})

describe('puckThreatensCpuGoal', () => {
  it('detects fast shot toward CPU goal', () => {
    expect(
      puckThreatensCpuGoal({ x: 0, z: 0, vx: -2, vz: 0 }),
    ).toBe(true)
  })

  it('ignores slow puck far from goal mouth', () => {
    expect(
      puckThreatensCpuGoal({ x: 0.5, z: 0.4, vx: -0.1, vz: 0 }),
    ).toBe(false)
  })
})

describe('buildPuckPath', () => {
  it('reflects once off Z wall', () => {
    const p = { x: 0, z: 0.48, vx: 0, vz: 3 }
    const path = buildPuckPath(p, 0.2, 1, 1, 0.5)
    expect(path.points.length).toBeGreaterThan(2)
    const last = path.points[path.points.length - 1]
    expect(last.z).toBeLessThanOrEqual(0.5)
  })
})
