import { TABLE_BORDER_HEIGHT, TABLE_DEPTH, TABLE_SURFACE_THICKNESS, TABLE_WIDTH } from './paddleConstants.js'
import { TABLE_CORNER_CHAMFER } from './gameConstants.js'

const hw = TABLE_WIDTH / 2
const hd = TABLE_DEPTH / 2
const chamfer = TABLE_CORNER_CHAMFER
const borderY = TABLE_BORDER_HEIGHT / 2 + TABLE_SURFACE_THICKNESS
const WALL_HALF_THICK = 0.065
const WALL_HALF_HEIGHT = TABLE_BORDER_HEIGHT / 2 + 0.02
const DIAG_OVERLAP = 0.012

const ROT_Y: Record<string, number> = {
  '1,1': Math.PI / 4,
  '1,-1': -Math.PI / 4,
  '-1,1': (3 * Math.PI) / 4,
  '-1,-1': (-3 * Math.PI) / 4,
}

export type ColliderDef = {
  position: [number, number, number]
  args: [number, number, number]
  rotation?: [number, number, number]
}

export function getCornerChamferLayout(signX: 1 | -1, signZ: 1 | -1): ColliderDef {
  const halfAlong = (chamfer * Math.SQRT2) / 2 + DIAG_OVERLAP
  const midX = signX * (hw - chamfer / 2)
  const midZ = signZ * (hd - chamfer / 2)
  const cx = midX + signX * WALL_HALF_THICK
  const cz = midZ + signZ * WALL_HALF_THICK
  return {
    position: [cx, borderY, cz],
    rotation: [0, ROT_Y[`${signX},${signZ}`] ?? 0, 0],
    args: [halfAlong, WALL_HALF_HEIGHT, WALL_HALF_THICK],
  }
}

export function cornerDiagonalMaxSum(): number {
  return hw - chamfer + (hd - chamfer)
}

export function cornerSignsFromPosition(
  x: number,
  z: number,
): { signX: 1 | -1; signZ: 1 | -1 } | null {
  if (x === 0 || z === 0) return null
  return { signX: x > 0 ? 1 : -1, signZ: z > 0 ? 1 : -1 }
}

export function isPuckInCornerWedge(x: number, z: number): boolean {
  const signs = cornerSignsFromPosition(x, z)
  if (!signs) return false
  const { signX, signZ } = signs
  const ax = hw - chamfer
  const az = hd - chamfer
  if (Math.abs(x) <= ax || Math.abs(z) <= az) return false
  const sum = signX * x + signZ * z
  return sum > cornerDiagonalMaxSum() + 1e-5
}

export function projectToCornerDiagonal(
  x: number,
  z: number,
  signX: 1 | -1,
  signZ: 1 | -1,
): { x: number; z: number; nx: number; nz: number } {
  const x0 = signX * (hw - chamfer)
  const z0 = signZ * hd
  const x1 = signX * hw
  const z1 = signZ * (hd - chamfer)
  const dx = x1 - x0
  const dz = z1 - z0
  const len2 = dx * dx + dz * dz
  const t =
    len2 < 1e-10
      ? 0
      : Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / len2))
  const px = x0 + dx * t
  const pz = z0 + dz * t
  const nx = -signX / Math.SQRT2
  const nz = -signZ / Math.SQRT2
  return { x: px, z: pz, nx, nz }
}
