import type { RapierRigidBody } from '@react-three/rapier'
import {
  PUCK_REST_Y,
  TABLE_PLAY_HALF_X,
  TABLE_PLAY_HALF_Z,
  WALL_PHYSICS,
} from '../constants/physics'

const PUCK_Y_MIN = PUCK_REST_Y - 0.001
const PUCK_Y_MAX = PUCK_REST_Y + 0.006

/**
 * Rede de segurança contra tunneling em alta velocidade:
 * mantém o disco na área jogável e próximo da superfície.
 */
export function enforcePuckTableBounds(body: RapierRigidBody) {
  const t = body.translation()
  const v = body.linvel()
  let { x, y, z } = t
  let vx = v.x
  let vy = v.y
  let vz = v.z
  let changed = false

  if (x < -TABLE_PLAY_HALF_X) {
    x = -TABLE_PLAY_HALF_X
    vx = Math.abs(vx) * WALL_PHYSICS.restitution
    changed = true
  } else if (x > TABLE_PLAY_HALF_X) {
    x = TABLE_PLAY_HALF_X
    vx = -Math.abs(vx) * WALL_PHYSICS.restitution
    changed = true
  }

  if (z < -TABLE_PLAY_HALF_Z) {
    z = -TABLE_PLAY_HALF_Z
    vz = Math.abs(vz) * WALL_PHYSICS.restitution
    changed = true
  } else if (z > TABLE_PLAY_HALF_Z) {
    z = TABLE_PLAY_HALF_Z
    vz = -Math.abs(vz) * WALL_PHYSICS.restitution
    changed = true
  }

  if (y < PUCK_Y_MIN) {
    y = PUCK_Y_MIN
    vy = 0
    changed = true
  } else if (y > PUCK_Y_MAX) {
    y = PUCK_Y_MAX
    vy = 0
    changed = true
  }

  if (!changed) return

  body.setTranslation({ x, y, z }, true)
  body.setLinvel({ x: vx, y: vy, z: vz }, true)
  body.wakeUp()
}
