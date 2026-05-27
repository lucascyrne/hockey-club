import type { RapierRigidBody } from '@react-three/rapier'
import { MAX_PUCK_SPEED, PUCK_RADIUS, PUCK_REST_Y } from '../constants/physics'
import { PADDLE_RADIUS } from '../constants/paddle'
import { snapPuckToTablePlane } from './puckBounds'
import { isCenterEngageZone, pickCenterStriker } from './cpuShared'
import type { PuckSample } from '../lib/puckTracker'
import { clampPaddlePosition, type PlayerId } from './bounds'

export type PlanarVelocity = { x: number; z: number }

export const PUCK_PADDLE_MIN_DIST = PUCK_RADIUS + PADDLE_RADIUS + 0.005

const MIN_SEPARATION_SPEED = 1.2
const PADDLE_REST_SPEED = 0.01

export function clampPlanarSpeed(x: number, z: number, max: number) {
  const speed = Math.hypot(x, z)
  if (speed <= max) return { x, z }
  const s = max / speed
  return { x: x * s, z: z * s }
}

/** Normal unitária do disco em relação à raquete (disco empurrado para fora). */
export function puckPaddleNormal(
  puckX: number,
  puckZ: number,
  paddleX: number,
  paddleZ: number,
  paddleVel: PlanarVelocity,
  fallbackAwayX: number,
): { nx: number; nz: number; dist: number } {
  let nx = puckX - paddleX
  let nz = puckZ - paddleZ
  const dist = Math.hypot(nx, nz)

  if (dist >= 1e-5) {
    return { nx: nx / dist, nz: nz / dist, dist }
  }

  const ps = Math.hypot(paddleVel.x, paddleVel.z)
  if (ps >= PADDLE_REST_SPEED) {
    return { nx: paddleVel.x / ps, nz: paddleVel.z / ps, dist: 0 }
  }

  const ax = Math.abs(fallbackAwayX) > 1e-5 ? Math.sign(fallbackAwayX) : 1
  return { nx: ax, nz: 0, dist: 0 }
}

/**
 * Depenetração contínua raquete–disco (XZ + impulso mínimo de saída).
 * Retorna true se posição ou velocidade foram corrigidas.
 */
export function resolvePuckPaddleOverlap(
  puckBody: RapierRigidBody,
  puckX: number,
  puckZ: number,
  paddleX: number,
  paddleZ: number,
  paddleVel: PlanarVelocity,
  fallbackAwayX: number,
  /** Direção X para empurrar o disco (lado adversário): P1 −1, P2 +1. */
  clearTowardEnemyX: number,
): boolean {
  let { nx, nz, dist } = puckPaddleNormal(
    puckX,
    puckZ,
    paddleX,
    paddleZ,
    paddleVel,
    fallbackAwayX,
  )

  if (dist >= PUCK_PADDLE_MIN_DIST) return false

  // Coincidência: empurra para o gol adversário + leve desvio ao centro em Z.
  if (dist < 1e-4) {
    nx = Math.sign(clearTowardEnemyX) || 1
    nz = Math.abs(puckZ) > 0.02 ? -Math.sign(puckZ) * 0.6 : 0.8
    const nLen = Math.hypot(nx, nz)
    nx /= nLen
    nz /= nLen
  }

  const sepX = paddleX + nx * PUCK_PADDLE_MIN_DIST
  const sepZ = paddleZ + nz * PUCK_PADDLE_MIN_DIST

  const v = puckBody.linvel()
  let vx = v.x
  let vz = v.z

  const relVx = vx - paddleVel.x
  const relVz = vz - paddleVel.z
  let outNormal = relVx * nx + relVz * nz

  if (outNormal < MIN_SEPARATION_SPEED) {
    const boost = MIN_SEPARATION_SPEED - outNormal
    vx += nx * boost
    vz += nz * boost
  }

  const clamped = clampPlanarSpeed(vx, vz, MAX_PUCK_SPEED)
  puckBody.setTranslation({ x: sepX, y: PUCK_REST_Y, z: sepZ }, true)
  puckBody.setLinvel({ x: clamped.x, y: 0, z: clamped.z }, true)
  puckBody.wakeUp()
  return true
}

type PaddleOverlap = {
  x: number
  z: number
  vel: PlanarVelocity
  awayX: number
  clearTowardEnemyX: number
}

/** Resolve overlaps pela raquete mais próxima primeiro (reduz “sanduíche” na demo). */
export function resolvePuckPaddleOverlaps(
  puckBody: RapierRigidBody,
  puckX: number,
  puckZ: number,
  paddles: PaddleOverlap[],
) {
  const puck: PuckSample = { x: puckX, z: puckZ, vx: 0, vz: 0 }
  let list = paddles

  if (isCenterEngageZone(puck) && paddles.length > 1) {
    const striker = pickCenterStriker(puck)
    const strikerIdx = paddles.findIndex((p) =>
      striker === 1 ? p.clearTowardEnemyX < 0 : p.clearTowardEnemyX > 0,
    )
    if (strikerIdx >= 0) list = [paddles[strikerIdx]]
  }

  const sorted = [...list].sort((a, b) => {
    const da = Math.hypot(puckX - a.x, puckZ - a.z)
    const db = Math.hypot(puckX - b.x, puckZ - b.z)
    return da - db
  })

  let px = puckX
  let pz = puckZ
  for (const paddle of sorted) {
    if (
      resolvePuckPaddleOverlap(
        puckBody,
        px,
        pz,
        paddle.x,
        paddle.z,
        paddle.vel,
        paddle.awayX,
        paddle.clearTowardEnemyX,
      )
    ) {
      const next = puckBody.translation()
      px = next.x
      pz = next.z
    }
  }
  snapPuckToTablePlane(puckBody)
}

/** Impõe velocidade mínima para dentro da mesa após clamp em parede. */
export function wallEscapeVelocity(
  vx: number,
  vz: number,
  escapeX: 0 | 1 | -1,
  escapeZ: 0 | 1 | -1,
  minSpeed: number,
): { vx: number; vz: number } {
  let outVx = vx
  let outVz = vz

  if (escapeX === 1 && outVx < minSpeed) outVx = minSpeed
  if (escapeX === -1 && outVx > -minSpeed) outVx = -minSpeed
  if (escapeZ === 1 && outVz < minSpeed) outVz = minSpeed
  if (escapeZ === -1 && outVz > -minSpeed) outVz = -minSpeed

  return { vx: outVx, vz: outVz }
}

const PADDLE_STANDOFF = PUCK_PADDLE_MIN_DIST + 0.01

/** Evita a IA empilhar a raquete no centro do disco. */
export function applyPaddleStandoff(
  targetX: number,
  targetZ: number,
  puckX: number,
  puckZ: number,
  playerId: PlayerId,
) {
  const dx = targetX - puckX
  const dz = targetZ - puckZ
  if (Math.hypot(dx, dz) >= PADDLE_STANDOFF) {
    return { x: targetX, z: targetZ }
  }

  const standoffX = playerId === 2 ? puckX - PADDLE_STANDOFF : puckX + PADDLE_STANDOFF
  return clampPaddlePosition(standoffX, targetZ, playerId)
}
