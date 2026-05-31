import { describe, expect, it } from 'vitest'
import { TABLE_DEPTH, TABLE_WIDTH } from '../constants/table'
import {
  TABLE_CORNER_CHAMFER,
  cornerDiagonalMaxSum,
  isPuckInCornerWedge,
  projectToCornerDiagonal,
} from '../constants/tableCorners'

const hw = TABLE_WIDTH / 2
const hd = TABLE_DEPTH / 2

/** Réplica do clamp diagonal para teste unitário. */
function diagonalClampPosition(x: number, z: number): { x: number; z: number } {
  if (!isPuckInCornerWedge(x, z)) return { x, z }
  const signX = x > 0 ? 1 : -1
  const signZ = z > 0 ? 1 : -1
  const sx = signX as 1 | -1
  const sz = signZ as 1 | -1
  const { x: px, z: pz, nx, nz } = projectToCornerDiagonal(x, z, sx, sz)
  let newX = px + nx * 0.012
  let newZ = pz + nz * 0.012
  const maxSum = cornerDiagonalMaxSum(sx, sz) - 0.012
  const sum = sx * newX + sz * newZ
  if (sum > maxSum) {
    const excess = sum - maxSum
    newX -= sx * excess
    newZ -= sz * excess
  }
  return { x: newX, z: newZ }
}

describe('puckBounds corner diagonal', () => {
  it('detecta disco dentro do triângulo ++', () => {
    expect(isPuckInCornerWedge(hw - 0.01, hd - 0.01)).toBe(true)
    expect(isPuckInCornerWedge(0, 0)).toBe(false)
  })

  it('repelir ponto ++ para lado jogável (abaixo da diagonal)', () => {
    const x = hw - 0.005
    const z = hd - 0.005
    const out = diagonalClampPosition(x, z)
    expect(out.x + out.z).toBeLessThanOrEqual(
      hw + hd - TABLE_CORNER_CHAMFER + 0.02,
    )
    expect(isPuckInCornerWedge(out.x, out.z)).toBe(false)
  })
})
