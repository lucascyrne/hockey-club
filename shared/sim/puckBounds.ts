import { GOAL_HALF_WIDTH } from './gameConstants.js'
import {
  PUCK_REST_Y,
  TABLE_PLAY_HALF_X,
  TABLE_PLAY_HALF_Z,
  WALL_PHYSICS,
} from './physicsConstants.js'
import { GOAL_LINE_X_NEG, GOAL_LINE_X_POS } from './rules.js'

const PUCK_Y_MIN = PUCK_REST_Y - 0.001
const PUCK_Y_MAX = PUCK_REST_Y + 0.006
const WALL_MIN_ESCAPE = 0.9
const GOAL_POCKET_X = 0.09

export type PlanarBody = {
  translation(): { x: number; y: number; z: number }
  linvel(): { x: number; y: number; z: number }
  setTranslation(t: { x: number; y: number; z: number }, wake: boolean): void
  setLinvel(v: { x: number; y: number; z: number }, wake: boolean): void
  wakeUp(): void
}

export function snapPuckToTablePlane(body: PlanarBody) {
  const t = body.translation()
  const v = body.linvel()
  if (Math.abs(t.y - PUCK_REST_Y) < 1e-6 && Math.abs(v.y) < 1e-6) return
  body.setTranslation({ x: t.x, y: PUCK_REST_Y, z: t.z }, true)
  body.setLinvel({ x: v.x, y: 0, z: v.z }, true)
}

export function enforcePuckTableBounds(body: PlanarBody) {
  const t = body.translation()
  const v = body.linvel()
  let { x, y, z } = t
  let vx = v.x
  let vy = v.y
  let vz = v.z
  let changed = false

  const inGoalMouth = Math.abs(z) < GOAL_HALF_WIDTH

  if (inGoalMouth) {
    if (x > GOAL_LINE_X_POS + GOAL_POCKET_X) {
      x = GOAL_LINE_X_POS + GOAL_POCKET_X
      vx = -Math.abs(vx || WALL_MIN_ESCAPE) * WALL_PHYSICS.restitution
      changed = true
    } else if (x < GOAL_LINE_X_NEG - GOAL_POCKET_X) {
      x = GOAL_LINE_X_NEG - GOAL_POCKET_X
      vx = Math.abs(vx || WALL_MIN_ESCAPE) * WALL_PHYSICS.restitution
      changed = true
    }
  } else if (x < -TABLE_PLAY_HALF_X) {
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

export function clampPuckSpeed(body: PlanarBody, maxSpeed: number) {
  const v = body.linvel()
  const speed = Math.hypot(v.x, v.z)
  if (speed <= maxSpeed) return
  const s = maxSpeed / speed
  body.setLinvel({ x: v.x * s, y: 0, z: v.z * s }, true)
}
