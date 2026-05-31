import {
  GOAL_HALF_WIDTH,
} from './game'
import { getCornerChamferLayout, TABLE_CORNER_CHAMFER } from './tableCorners'
import {
  TABLE_BORDER_HEIGHT,
  TABLE_DEPTH,
  TABLE_SURFACE_THICKNESS,
  TABLE_WIDTH,
} from './table'

export const GRAVITY: [number, number, number] = [0, 0, 0]
export const PHYSICS_TIMESTEP = 1 / 60

export const PUCK_RADIUS = 0.025
export const PUCK_HEIGHT = 0.007
export const PUCK_AIR_GAP = 0.00035
export const PUCK_MASS = 0.05
export const MAX_PUCK_SPEED = 10

export const TABLE_PLAY_HALF_X = TABLE_WIDTH / 2 - PUCK_RADIUS - 0.003
export const TABLE_PLAY_HALF_Z = TABLE_DEPTH / 2 - PUCK_RADIUS - 0.003

export { TABLE_CORNER_CHAMFER }

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

export const PUCK_REST_Y =
  TABLE_SURFACE_TOP + PUCK_HEIGHT / 2 + PUCK_AIR_GAP
export const PUCK_SPAWN: [number, number, number] = [0, PUCK_REST_Y, 0]

const hw = TABLE_WIDTH / 2
const hd = TABLE_DEPTH / 2
const bh = TABLE_BORDER_HEIGHT
const borderY = bh / 2 + TABLE_SURFACE_THICKNESS
const chamfer = TABLE_CORNER_CHAMFER

const WALL_COLLIDER_HALF_THICKNESS = 0.065
const WALL_COLLIDER_HALF_HEIGHT = bh / 2 + 0.02

/** Segmentos de parede nas pontas ±X com abertura de gol ao centro (eixo Z). */
const endSegHalfZ = (hd - GOAL_HALF_WIDTH - chamfer) / 2
const endSegCenterZ = GOAL_HALF_WIDTH + endSegHalfZ
const endX = hw + WALL_COLLIDER_HALF_THICKNESS
const sideHalfX = hw - chamfer

type ColliderDef = {
  position: [number, number, number]
  args: [number, number, number]
  rotation?: [number, number, number]
}

function endWallSegment(signX: number, signZ: number): ColliderDef {
  return {
    position: [
      signX * endX,
      borderY,
      signZ * endSegCenterZ,
    ],
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

export const TABLE_COLLIDERS = {
  floor: {
    position: [0, TABLE_SURFACE_TOP - 0.003, 0] as [number, number, number],
    args: [hw + 0.02, 0.008, hd + 0.02] as [number, number, number],
  },
  wallEndNegXNear: endWallSegment(-1, -1),
  wallEndNegXFar: endWallSegment(-1, 1),
  wallEndPosXNear: endWallSegment(1, -1),
  wallEndPosXFar: endWallSegment(1, 1),
  wallSideNegZ: {
    position: [0, borderY, -hd - WALL_COLLIDER_HALF_THICKNESS] as [
      number,
      number,
      number,
    ],
    args: [sideHalfX, WALL_COLLIDER_HALF_HEIGHT, WALL_COLLIDER_HALF_THICKNESS] as [
      number,
      number,
      number,
    ],
  },
  wallSidePosZ: {
    position: [0, borderY, hd + WALL_COLLIDER_HALF_THICKNESS] as [
      number,
      number,
      number,
    ],
    args: [sideHalfX, WALL_COLLIDER_HALF_HEIGHT, WALL_COLLIDER_HALF_THICKNESS] as [
      number,
      number,
      number,
    ],
  },
  wallCornerNegXNegZ: cornerChamferCollider(-1, -1),
  wallCornerNegXPosZ: cornerChamferCollider(-1, 1),
  wallCornerPosXNegZ: cornerChamferCollider(1, -1),
  wallCornerPosXPosZ: cornerChamferCollider(1, 1),
} as const
