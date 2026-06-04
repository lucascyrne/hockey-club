export {
  getNamedTableColliders,
  MAX_PUCK_SPEED,
  PHYSICS_TIMESTEP,
  PUCK_AIR_GAP,
  PUCK_HEIGHT,
  PUCK_MASS,
  PUCK_PHYSICS,
  PUCK_RADIUS,
  PUCK_REST_Y,
  TABLE_CORNER_CHAMFER,
  TABLE_PLAY_HALF_X,
  TABLE_PLAY_HALF_Z,
  TABLE_SURFACE_TOP,
  WALL_PHYSICS,
} from '../../shared/sim/physicsConstants'

import { getNamedTableColliders, PUCK_REST_Y } from '../../shared/sim/physicsConstants'

export const GRAVITY: [number, number, number] = [0, 0, 0]
export const PUCK_SPAWN: [number, number, number] = [0, PUCK_REST_Y, 0]
export const TABLE_COLLIDERS = getNamedTableColliders()
