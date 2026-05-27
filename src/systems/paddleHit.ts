import type { RapierRigidBody } from '@react-three/rapier'
import { MAX_PUCK_SPEED } from '../constants/physics'
import { PADDLE_TRANSFER_FACTOR } from '../constants/paddle'
import {
  clampPlanarSpeed,
  puckPaddleNormal,
  PUCK_PADDLE_MIN_DIST,
  resolvePuckPaddleOverlap,
  type PlanarVelocity,
} from './puckContact'

export type { PlanarVelocity } from './puckContact'

/**
 * Impulso de impacto (onCollisionEnter) + depenetração partilhada com o passo contínuo.
 */
export function resolvePaddlePuckCollision(
  puckBody: RapierRigidBody,
  puckX: number,
  puckZ: number,
  paddleX: number,
  paddleZ: number,
  paddleVel: PlanarVelocity,
  fallbackAwayX = 1,
  hitStrength = 1,
) {
  const strength = Math.max(0.2, Math.min(1.5, hitStrength))
  const { nx, nz, dist } = puckPaddleNormal(
    puckX,
    puckZ,
    paddleX,
    paddleZ,
    paddleVel,
    fallbackAwayX,
  )

  const overlap = PUCK_PADDLE_MIN_DIST - dist
  if (overlap > 0) {
    resolvePuckPaddleOverlap(
      puckBody,
      puckX,
      puckZ,
      paddleX,
      paddleZ,
      paddleVel,
      fallbackAwayX,
    )
  }

  const v = puckBody.linvel()
  const relVx = v.x - paddleVel.x
  const relVz = v.z - paddleVel.z
  const relNormal = relVx * nx + relVz * nz

  const restitution = 0.88
  let newVx = v.x
  let newVz = v.z

  if (relNormal <= 0.25) {
    const impulseN = -(1 + restitution) * relNormal
    newVx = v.x + impulseN * nx
    newVz = v.z + impulseN * nz
  }

  const paddleSpeed = Math.hypot(paddleVel.x, paddleVel.z)
  if (overlap > 0.002 && paddleSpeed > 0.08) {
    const push = (paddleSpeed * PADDLE_TRANSFER_FACTOR + 1.8) * strength
    newVx = paddleVel.x + nx * push
    newVz = paddleVel.z + nz * push
  }

  const outNormal = (newVx - paddleVel.x) * nx + (newVz - paddleVel.z) * nz
  const minOut = 1.5 * strength
  if (outNormal < minOut) {
    const boost = minOut - outNormal
    newVx += nx * boost
    newVz += nz * boost
  }

  if (fallbackAwayX < 0 && strength < 0.8) {
    const gentleMin = 0.55 + strength * 0.9
    if (newVx < gentleMin) newVx = gentleMin
  }

  const { x, z } = clampPlanarSpeed(newVx, newVz, MAX_PUCK_SPEED)
  puckBody.setLinvel({ x, y: 0, z }, true)
  puckBody.wakeUp()
}
