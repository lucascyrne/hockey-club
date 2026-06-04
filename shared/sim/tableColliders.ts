import { GOAL_HALF_WIDTH, TABLE_CORNER_CHAMFER } from './gameConstants.js'
import { TABLE_BORDER_HEIGHT, TABLE_DEPTH, TABLE_SURFACE_THICKNESS, TABLE_WIDTH } from './paddleConstants.js'
import { TABLE_SURFACE_TOP } from './physicsConstants.js'
import { getCornerChamferLayout } from './tableCorners.js'
import type { ColliderDef } from './tableCorners.js'

export type { ColliderDef } from './tableCorners.js'

export type NamedTableColliders = {
  floor: ColliderDef
  wallEndNegXNear: ColliderDef
  wallEndNegXFar: ColliderDef
  wallEndPosXNear: ColliderDef
  wallEndPosXFar: ColliderDef
  wallSideNegZ: ColliderDef
  wallSidePosZ: ColliderDef
  wallCornerNegXNegZ: ColliderDef
  wallCornerNegXPosZ: ColliderDef
  wallCornerPosXNegZ: ColliderDef
  wallCornerPosXPosZ: ColliderDef
}

const hw = TABLE_WIDTH / 2
const hd = TABLE_DEPTH / 2
const bh = TABLE_BORDER_HEIGHT
const borderY = bh / 2 + TABLE_SURFACE_THICKNESS
const chamfer = TABLE_CORNER_CHAMFER
const WALL_COLLIDER_HALF_THICKNESS = 0.065
const WALL_COLLIDER_HALF_HEIGHT = bh / 2 + 0.02

const endSegHalfZ = (hd - GOAL_HALF_WIDTH - chamfer) / 2
const endSegCenterZ = GOAL_HALF_WIDTH + endSegHalfZ
const endX = hw + WALL_COLLIDER_HALF_THICKNESS
const sideHalfX = hw - chamfer

function endWallSegment(signX: number, signZ: number): ColliderDef {
  return {
    position: [signX * endX, borderY, signZ * endSegCenterZ],
    args: [
      WALL_COLLIDER_HALF_THICKNESS,
      WALL_COLLIDER_HALF_HEIGHT,
      Math.max(0.05, endSegHalfZ),
    ],
  }
}

function cornerChamferCollider(signX: 1 | -1, signZ: 1 | -1): ColliderDef {
  const layout = getCornerChamferLayout(signX, signZ)
  return {
    position: layout.position,
    rotation: layout.rotation,
    args: layout.args,
  }
}

export function getNamedTableColliders(): NamedTableColliders {
  return {
    floor: {
      position: [0, TABLE_SURFACE_TOP - 0.003, 0],
      args: [hw + 0.02, 0.008, hd + 0.02],
    },
    wallEndNegXNear: endWallSegment(-1, -1),
    wallEndNegXFar: endWallSegment(-1, 1),
    wallEndPosXNear: endWallSegment(1, -1),
    wallEndPosXFar: endWallSegment(1, 1),
    wallSideNegZ: {
      position: [0, borderY, -hd - WALL_COLLIDER_HALF_THICKNESS],
      args: [sideHalfX, WALL_COLLIDER_HALF_HEIGHT, WALL_COLLIDER_HALF_THICKNESS],
    },
    wallSidePosZ: {
      position: [0, borderY, hd + WALL_COLLIDER_HALF_THICKNESS],
      args: [sideHalfX, WALL_COLLIDER_HALF_HEIGHT, WALL_COLLIDER_HALF_THICKNESS],
    },
    wallCornerNegXNegZ: cornerChamferCollider(-1, -1),
    wallCornerNegXPosZ: cornerChamferCollider(-1, 1),
    wallCornerPosXNegZ: cornerChamferCollider(1, -1),
    wallCornerPosXPosZ: cornerChamferCollider(1, 1),
  }
}

export function getTableColliderList(): ColliderDef[] {
  const c = getNamedTableColliders()
  return [
    c.floor,
    c.wallEndNegXNear,
    c.wallEndNegXFar,
    c.wallEndPosXNear,
    c.wallEndPosXFar,
    c.wallSideNegZ,
    c.wallSidePosZ,
    c.wallCornerNegXNegZ,
    c.wallCornerNegXPosZ,
    c.wallCornerPosXNegZ,
    c.wallCornerPosXPosZ,
  ]
}
