import type { RapierRigidBody } from '@react-three/rapier'
import type { PuckSample } from '../lib/puckTracker'
import {
  applyPaddleStandoff,
  clampPlanarSpeed,
  isPuckBehindPaddlePlanar,
  placePuckOnStrikeSide,
  puckPaddleNormal,
  PUCK_PADDLE_MIN_DIST,
  resolvePuckPaddleOverlap,
  resolvePuckPaddleOverlaps as resolvePuckPaddleOverlapsCore,
  wallEscapeVelocity,
  type PaddleOverlap,
  type PlanarVelocity,
} from '../../shared/sim/puckContact'
import { snapPuckToTablePlane } from '../../shared/sim/puckBounds'
import { isCenterEngageZone, pickCenterStriker } from './cpuShared'

export type { PlanarVelocity, PaddleOverlap }
export {
  applyPaddleStandoff,
  clampPlanarSpeed,
  isPuckBehindPaddlePlanar,
  placePuckOnStrikeSide,
  puckPaddleNormal,
  PUCK_PADDLE_MIN_DIST,
  resolvePuckPaddleOverlap,
  wallEscapeVelocity,
}

/** Resolve overlaps; prioriza raquete com disco “atrás” + regra CPU no centro. */
export function resolvePuckPaddleOverlaps(
  puckBody: RapierRigidBody,
  puckX: number,
  puckZ: number,
  paddles: PaddleOverlap[],
) {
  const puck: PuckSample = { x: puckX, z: puckZ, vx: 0, vz: 0 }
  let list = paddles

  const anyBehind = paddles.some((p) =>
    isPuckBehindPaddlePlanar(puckX, p.x, p.clearTowardEnemyX),
  )

  if (isCenterEngageZone(puck) && paddles.length > 1 && !anyBehind) {
    const striker = pickCenterStriker(puck)
    const strikerIdx = paddles.findIndex((p) =>
      striker === 1 ? p.clearTowardEnemyX < 0 : p.clearTowardEnemyX > 0,
    )
    if (strikerIdx >= 0) list = [paddles[strikerIdx]]
  }

  resolvePuckPaddleOverlapsCore(puckBody, puckX, puckZ, list)
  snapPuckToTablePlane(puckBody)
}
