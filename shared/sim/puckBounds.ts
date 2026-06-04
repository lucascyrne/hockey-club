import { GOAL_HALF_WIDTH } from './gameConstants.js'
import {
  cornerDiagonalMaxSum,
  cornerSignsFromPosition,
  isPuckInCornerWedge,
  projectToCornerDiagonal,
} from './tableCorners.js'
import {
  PUCK_REST_Y,
  TABLE_PLAY_HALF_X,
  TABLE_PLAY_HALF_Z,
  WALL_PHYSICS,
} from './physicsConstants.js'
import { GOAL_LINE_X_NEG, GOAL_LINE_X_POS } from './rules.js'
import { wallEscapeVelocity } from './puckContact.js'
import type { PlanarBody } from './types.js'

const PUCK_Y_MIN = PUCK_REST_Y - 0.001
const PUCK_Y_MAX = PUCK_REST_Y + 0.006
const WALL_MIN_ESCAPE = 0.9
const GOAL_POCKET_X = 0.09
const CORNER_INSET = 0.012

export type { PlanarBody } from './types.js'

export type PuckBoundsOptions = {
  onWallHit?: (speed: number) => void
}

function applyCornerDiagonalClamp(
  x: number,
  z: number,
  vx: number,
  vz: number,
): { x: number; z: number; vx: number; vz: number; changed: boolean } {
  if (!isPuckInCornerWedge(x, z)) {
    return { x, z, vx, vz, changed: false }
  }

  const signs = cornerSignsFromPosition(x, z)
  if (!signs) return { x, z, vx, vz, changed: false }

  const { signX, signZ } = signs
  const { x: px, z: pz, nx, nz } = projectToCornerDiagonal(x, z, signX, signZ)

  let newX = px + nx * CORNER_INSET
  let newZ = pz + nz * CORNER_INSET

  const maxSum = cornerDiagonalMaxSum() - CORNER_INSET
  const sum = signX * newX + signZ * newZ
  if (sum > maxSum) {
    const excess = sum - maxSum
    newX -= signX * excess
    newZ -= signZ * excess
  }

  let newVx = vx
  let newVz = vz
  const out = newVx * nx + newVz * nz
  if (out < WALL_MIN_ESCAPE) {
    newVx += nx * WALL_MIN_ESCAPE
    newVz += nz * WALL_MIN_ESCAPE
  }

  return { x: newX, z: newZ, vx: newVx, vz: newVz, changed: true }
}

export function snapPuckToTablePlane(body: PlanarBody) {
  const t = body.translation()
  const v = body.linvel()
  if (Math.abs(t.y - PUCK_REST_Y) < 1e-6 && Math.abs(v.y) < 1e-6) return false
  body.setTranslation({ x: t.x, y: PUCK_REST_Y, z: t.z }, true)
  body.setLinvel({ x: v.x, y: 0, z: v.z }, true)
  return true
}

export function enforcePuckTableBounds(
  body: PlanarBody,
  options?: PuckBoundsOptions,
) {
  const t = body.translation()
  const v = body.linvel()
  let { x, y, z } = t
  let vx = v.x
  let vy = v.y
  let vz = v.z
  let changed = false
  let escapeX: 0 | 1 | -1 = 0
  let escapeZ: 0 | 1 | -1 = 0

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
    escapeX = 1
    changed = true
  } else if (x > TABLE_PLAY_HALF_X) {
    x = TABLE_PLAY_HALF_X
    vx = -Math.abs(vx) * WALL_PHYSICS.restitution
    escapeX = -1
    changed = true
  }

  if (z < -TABLE_PLAY_HALF_Z) {
    z = -TABLE_PLAY_HALF_Z
    vz = Math.abs(vz) * WALL_PHYSICS.restitution
    escapeZ = 1
    changed = true
  } else if (z > TABLE_PLAY_HALF_Z) {
    z = TABLE_PLAY_HALF_Z
    vz = -Math.abs(vz) * WALL_PHYSICS.restitution
    escapeZ = -1
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

  const speed = Math.hypot(vx, vz)
  const atWallZ = Math.abs(z) >= TABLE_PLAY_HALF_Z - 0.025
  const atWallX =
    !inGoalMouth &&
    (Math.abs(x) >= TABLE_PLAY_HALF_X - 0.025 ||
      x <= -TABLE_PLAY_HALF_X + 0.001 ||
      x >= TABLE_PLAY_HALF_X - 0.001)

  if (speed < 0.4 && (atWallZ || atWallX)) {
    if (atWallZ && Math.abs(vz) < 0.5) {
      vz = -Math.sign(z || 1) * WALL_MIN_ESCAPE
      changed = true
    }
    if (atWallX && Math.abs(vx) < 0.5) {
      vx = -Math.sign(x || 1) * WALL_MIN_ESCAPE * 0.85
      changed = true
    }
  }

  const corner = applyCornerDiagonalClamp(x, z, vx, vz)
  if (corner.changed) {
    x = corner.x
    z = corner.z
    vx = corner.vx
    vz = corner.vz
    changed = true
  }

  if (!changed) return

  const wallHit = escapeX !== 0 || escapeZ !== 0 || corner.changed
  if (wallHit && options?.onWallHit) {
    options.onWallHit(Math.hypot(v.x, v.z))
  }

  if (escapeX !== 0 || escapeZ !== 0) {
    const escaped = wallEscapeVelocity(vx, vz, escapeX, escapeZ, WALL_MIN_ESCAPE)
    vx = escaped.vx
    vz = escaped.vz
  }

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
