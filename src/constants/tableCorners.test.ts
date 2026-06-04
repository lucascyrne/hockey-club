import { describe, expect, it } from 'vitest'
import { TABLE_DEPTH, TABLE_WIDTH } from './table'
import {
  TABLE_CORNER_CHAMFER,
  getCornerChamferLayout,
  isPuckInCornerWedge,
  projectToCornerDiagonal,
} from './tableCorners'

const hw = TABLE_WIDTH / 2
const hd = TABLE_DEPTH / 2

describe('tableCorners layout', () => {
  it('canto ++ tem rotY ≈ π/4 e posição com offset para +Z exterior', () => {
    const layout = getCornerChamferLayout(1, 1)
    expect(layout.rotation?.[1]).toBeCloseTo(Math.PI / 4, 5)
    expect(layout.position[0]).toBeCloseTo(hw - TABLE_CORNER_CHAMFER / 2 + 0.065, 4)
    expect(layout.position[2]).toBeGreaterThan(hd - TABLE_CORNER_CHAMFER)
  })

  it('detecta disco no triângulo ++', () => {
    const x = hw - 0.01
    const z = hd - 0.01
    expect(isPuckInCornerWedge(x, z)).toBe(true)
  })

  it('projeta ponto do triângulo para a diagonal', () => {
    const x = hw - 0.005
    const z = hd - 0.005
    const { x: px, z: pz } = projectToCornerDiagonal(x, z, 1, 1)
    expect(px).toBeGreaterThan(hw - TABLE_CORNER_CHAMFER - 0.02)
    expect(pz).toBeGreaterThan(hd - TABLE_CORNER_CHAMFER - 0.02)
    expect(px + pz).toBeLessThanOrEqual(hw + hd - TABLE_CORNER_CHAMFER + 0.02)
  })
})
