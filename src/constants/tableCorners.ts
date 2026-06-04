export {
  cornerDiagonalMaxSum,
  cornerSignsFromPosition,
  getCornerChamferLayout,
  isPuckInCornerWedge,
  projectToCornerDiagonal,
} from '../../shared/sim/tableCorners'

export type { ColliderDef } from '../../shared/sim/tableCorners'

export { TABLE_CORNER_CHAMFER } from '../../shared/sim/gameConstants'

export type CornerLayout = import('../../shared/sim/tableCorners').ColliderDef
