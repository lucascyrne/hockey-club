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
