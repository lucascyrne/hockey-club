import type { RapierRigidBody } from '@react-three/rapier'
import { MAX_PUCK_SPEED, PUCK_RADIUS } from '../constants/physics'
import { PADDLE_RADIUS, PADDLE_TRANSFER_FACTOR } from '../constants/paddle'

export type PlanarVelocity = { x: number; z: number }

function clampPlanarSpeed(x: number, z: number, max: number) {
  const speed = Math.hypot(x, z)
  if (speed <= max) return { x, z }
  const s = max / speed
  return { x: x * s, z: z * s }
}

/**
 * Colisão elástica na normal de contato (referencial da raquete).
 * Evita o disco “grudar” quando a velocidade relativa ≈ 0 (caso comum com kinematic + atrito).
 */
export function resolvePaddlePuckCollision(
  puckBody: RapierRigidBody,
  puckX: number,
  puckZ: number,
  paddleX: number,
  paddleZ: number,
  paddleVel: PlanarVelocity,
) {
  let nx = puckX - paddleX
  let nz = puckZ - paddleZ
  const dist = Math.hypot(nx, nz)

  if (dist < 1e-5) {
    const ps = Math.hypot(paddleVel.x, paddleVel.z)
    if (ps < 0.01) return
    nx = paddleVel.x / ps
    nz = paddleVel.z / ps
  } else {
    nx /= dist
    nz /= dist
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

  const overlap = PUCK_RADIUS + PADDLE_RADIUS - dist
  const paddleSpeed = Math.hypot(paddleVel.x, paddleVel.z)
  if (overlap > 0.002 && paddleSpeed > 0.15) {
    const push = paddleSpeed * PADDLE_TRANSFER_FACTOR + 1.8
    newVx = paddleVel.x + nx * push
    newVz = paddleVel.z + nz * push
  }

  const outNormal = (newVx - paddleVel.x) * nx + (newVz - paddleVel.z) * nz
  if (outNormal < 1.5) {
    const boost = 1.5 - outNormal
    newVx += nx * boost
    newVz += nz * boost
  }

  const { x, z } = clampPlanarSpeed(newVx, newVz, MAX_PUCK_SPEED)
  puckBody.setLinvel({ x, y: 0, z }, true)
  puckBody.wakeUp()
}
