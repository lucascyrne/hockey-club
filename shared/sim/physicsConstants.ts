import { TABLE_CORNER_CHAMFER } from './gameConstants.js'
import { TABLE_DEPTH, TABLE_SURFACE_THICKNESS, TABLE_WIDTH } from './paddleConstants.js'
import { getTableColliderList } from './tableColliders.js'

export { TABLE_CORNER_CHAMFER }
export { getNamedTableColliders, getTableColliderList } from './tableColliders.js'
export type { ColliderDef, NamedTableColliders } from './tableColliders.js'

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

export const TABLE_COLLIDERS = getTableColliderList()
