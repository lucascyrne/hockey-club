import { GOAL_HALF_WIDTH, TABLE_CORNER_CHAMFER } from './gameConstants.js'
import { TABLE_BORDER_HEIGHT, TABLE_DEPTH, TABLE_SURFACE_THICKNESS, TABLE_WIDTH } from './paddleConstants.js'
import { getCornerChamferLayout } from './tableCorners.js'

export { TABLE_CORNER_CHAMFER }

export const PHYSICS_TIMESTEP = 1 / 60
export const SERVER_TICK_HZ = 60

export const PUCK_RADIUS = 0.025
export const PUCK_HEIGHT = 0.007
export const PUCK_AIR_GAP = 0.00035
export const PUCK_MASS = 0.05
export const MAX_PUCK_SPEED = 10

export const TABLE_PLAY_HALF_X = TABLE_WIDTH / 2 - PUCK_RADIUS - 0.003
export const TABLE_PLAY_HALF_Z = TABLE_DEPTH / 2 - PUCK_RADIUS - 0.003

export const PUCK_PHYSICS = {
  friction: 0.02,
  restitution: 0.94,
  linearDamping: 0.18,
  angularDamping: 0.45,
} as const

export const WALL_PHYSICS = {
  friction: 0.05,
  restitution: 0.82,
} as const

export const TABLE_SURFACE_TOP = TABLE_SURFACE_THICKNESS
export const PUCK_REST_Y = TABLE_SURFACE_TOP + PUCK_HEIGHT / 2 + PUCK_AIR_GAP

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

export type ColliderDef = {
  position: [number, number, number]
  args: [number, number, number]
  rotation?: [number, number, number]
}

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

export const TABLE_COLLIDERS: ColliderDef[] = [
  {
    position: [0, TABLE_SURFACE_TOP - 0.003, 0],
    args: [hw + 0.02, 0.008, hd + 0.02],
  },
  endWallSegment(-1, -1),
  endWallSegment(-1, 1),
  endWallSegment(1, -1),
  endWallSegment(1, 1),
  {
    position: [0, borderY, -hd - WALL_COLLIDER_HALF_THICKNESS],
    args: [sideHalfX, WALL_COLLIDER_HALF_HEIGHT, WALL_COLLIDER_HALF_THICKNESS],
  },
  {
    position: [0, borderY, hd + WALL_COLLIDER_HALF_THICKNESS],
    args: [sideHalfX, WALL_COLLIDER_HALF_HEIGHT, WALL_COLLIDER_HALF_THICKNESS],
  },
  getCornerChamferLayout(-1, -1),
  getCornerChamferLayout(-1, 1),
  getCornerChamferLayout(1, -1),
  getCornerChamferLayout(1, 1),
]
