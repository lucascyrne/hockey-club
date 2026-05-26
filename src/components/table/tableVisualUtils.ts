import { TABLE_DEPTH, TABLE_WIDTH } from '../../constants/table'
import { TABLE_SURFACE_TOP } from '../../constants/physics'

export const TABLE_HW = TABLE_WIDTH / 2
export const TABLE_HD = TABLE_DEPTH / 2

export const PLAYFIELD_Y = TABLE_SURFACE_TOP + 0.0008

/** Rotação Z do arco de escanteio (plano da mesa) para apontar ao centro. */
export function cornerMarkRotationZ(sx: 1 | -1, sz: 1 | -1): number {
  if (sx === -1 && sz === -1) return 0
  if (sx === 1 && sz === -1) return Math.PI / 2
  if (sx === 1 && sz === 1) return Math.PI
  return (3 * Math.PI) / 2
}
