import { MAX_PUCK_SPEED } from './physicsConstants.js'
import type { PlanarBody } from './puckBounds.js'

const PUCK_PADDLE_MIN_DIST = 0.086
const PADDLE_TRANSFER_FACTOR = 0.45

export function resolvePaddlePuckCollision(
  puckBody: PlanarBody,
  puckX: number,
  puckZ: number,
  paddleX: number,
  paddleZ: number,
  paddleVx: number,
  paddleVz: number,
  fallbackAwayX: number,
) {
  const dx = puckX - paddleX
  const dz = puckZ - paddleZ
  const dist = Math.hypot(dx, dz) || 1e-6
  let nx = dx / dist
  let nz = dz / dist
  if (dist < 1e-4) {
    nx = fallbackAwayX
    nz = 0
  }

  const overlap = PUCK_PADDLE_MIN_DIST - dist
  if (overlap > 0) {
    puckBody.setTranslation(
      { x: puckX + nx * overlap, y: puckBody.translation().y, z: puckZ + nz * overlap },
      true,
    )
  }

  const v = puckBody.linvel()
  const relNormal = (v.x - paddleVx) * nx + (v.z - paddleVz) * nz
  const restitution = 0.88
  let newVx = v.x
  let newVz = v.z

  if (relNormal < 0) {
    const impulse = -(1 + restitution) * relNormal
    newVx += impulse * nx
    newVz += impulse * nz
  }

  newVx += paddleVx * PADDLE_TRANSFER_FACTOR
  newVz += paddleVz * PADDLE_TRANSFER_FACTOR

  const speed = Math.hypot(newVx, newVz)
  if (speed > MAX_PUCK_SPEED) {
    const s = MAX_PUCK_SPEED / speed
    newVx *= s
    newVz *= s
  }

  puckBody.setLinvel({ x: newVx, y: 0, z: newVz }, true)
  puckBody.wakeUp()
}
