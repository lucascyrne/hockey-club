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
const DEEP_OVERLAP_RATIO = 0.98

/** Posição no hemisfério de ataque (lado adversário em X). */
export function placePuckOnStrikeSide(
  paddleX: number,
  paddleZ: number,
  puckZ: number,
  clearTowardEnemyX: number,
): { x: number; z: number } {
  const sx = Math.sign(clearTowardEnemyX) || 1
  const sepX = paddleX + sx * PUCK_PADDLE_MIN_DIST
  const dz = puckZ - paddleZ
  const maxZ = Math.sqrt(Math.max(0, PUCK_PADDLE_MIN_DIST * PUCK_PADDLE_MIN_DIST - 1e-8))
  const sepZ =
    Math.abs(dz) <= maxZ ? puckZ : paddleZ + Math.sign(dz || 1) * maxZ * 0.85
  return { x: sepX, z: sepZ }
}

function enforceClearVelocityX(
  vx: number,
  clearTowardEnemyX: number,
  minOut: number,
): number {
  const sx = Math.sign(clearTowardEnemyX) || 1
  if (sx > 0 && vx < minOut) return minOut
  if (sx < 0 && vx > -minOut) return -minOut
  return vx
}

export function clampPlanarSpeed(x: number, z: number, max: number) {
  const speed = Math.hypot(x, z)
  if (speed <= max) return { x, z }
  const s = max / speed
  return { x: x * s, z: z * s }
}

/** Disco do lado do nosso gol em relação à raquete (tunnel / “por baixo”). */
export function isPuckBehindPaddlePlanar(
  puckX: number,
  paddleX: number,
  clearTowardEnemyX: number,
): boolean {
  return clearTowardEnemyX > 0
    ? puckX < paddleX - 0.001
    : puckX > paddleX + 0.001
}

function separationNormalTowardEnemy(
  puckZ: number,
  paddleZ: number,
  clearTowardEnemyX: number,
): { nx: number; nz: number } {
  let nx = Math.sign(clearTowardEnemyX) || 1
  let nz = puckZ - paddleZ
  if (Math.hypot(nz) < 0.008) {
    nz = Math.abs(puckZ) > 0.02 ? -Math.sign(puckZ) * 0.5 : 0.4
  }
  const len = Math.hypot(nx, nz)
  return { nx: nx / len, nz: nz / len }
}

/** Normal unitária do disco em relação à raquete (disco empurrado para fora). */
export function puckPaddleNormal(
  puckX: number,
  puckZ: number,
  paddleX: number,
  paddleZ: number,
  paddleVel: PlanarVelocity,
  fallbackAwayX: number,
  clearTowardEnemyX?: number,
): { nx: number; nz: number; dist: number } {
  let nx = puckX - paddleX
  let nz = puckZ - paddleZ
  const dist = Math.hypot(nx, nz)

  if (clearTowardEnemyX !== undefined && dist < PUCK_PADDLE_MIN_DIST) {
    const behind = isPuckBehindPaddlePlanar(puckX, paddleX, clearTowardEnemyX)
    const deep = dist < PUCK_PADDLE_MIN_DIST * DEEP_OVERLAP_RATIO
    if (behind || deep) {
      const sep = separationNormalTowardEnemy(puckZ, paddleZ, clearTowardEnemyX)
      return { nx: sep.nx, nz: sep.nz, dist }
    }
  }

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
    clearTowardEnemyX,
  )

  if (dist >= PUCK_PADDLE_MIN_DIST) return false

  const behind = isPuckBehindPaddlePlanar(puckX, paddleX, clearTowardEnemyX)
  const useStrikeSide =
    behind || dist < PUCK_PADDLE_MIN_DIST * DEEP_OVERLAP_RATIO

  let sepX: number
  let sepZ: number
  if (useStrikeSide) {
    const placed = placePuckOnStrikeSide(
      paddleX,
      paddleZ,
      puckZ,
      clearTowardEnemyX,
    )
    sepX = placed.x
    sepZ = placed.z
    const sep = separationNormalTowardEnemy(puckZ, paddleZ, clearTowardEnemyX)
    nx = sep.nx
    nz = sep.nz
  } else {
    if (dist < 1e-4) {
      const sep = separationNormalTowardEnemy(puckZ, paddleZ, clearTowardEnemyX)
      nx = sep.nx
      nz = sep.nz
    }
    sepX = paddleX + nx * PUCK_PADDLE_MIN_DIST
    sepZ = paddleZ + nz * PUCK_PADDLE_MIN_DIST
  }

  const v = puckBody.linvel()
  let vx = v.x
  let vz = v.z

  if (behind) {
    vx = enforceClearVelocityX(vx, clearTowardEnemyX, MIN_SEPARATION_SPEED)
  }

  const relVx = vx - paddleVel.x
  const relVz = vz - paddleVel.z
  let outNormal = relVx * nx + relVz * nz

  if (outNormal < MIN_SEPARATION_SPEED) {
    const boost = MIN_SEPARATION_SPEED - outNormal
    vx += nx * boost
    vz += nz * boost
  }

  if (behind) {
    vx = enforceClearVelocityX(vx, clearTowardEnemyX, MIN_SEPARATION_SPEED * 0.5)
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

function paddleOverlapDist(
  puckX: number,
  puckZ: number,
  paddle: PaddleOverlap,
): number {
  return Math.hypot(puckX - paddle.x, puckZ - paddle.z)
}

function sortPaddlesForOverlap(
  puckX: number,
  puckZ: number,
  paddles: PaddleOverlap[],
): PaddleOverlap[] {
  const bothNear =
    paddles.length > 1 &&
    paddles.every((p) => paddleOverlapDist(puckX, puckZ, p) < PUCK_PADDLE_MIN_DIST)

  if (bothNear) {
    const behindFirst = paddles.filter((p) =>
      isPuckBehindPaddlePlanar(puckX, p.x, p.clearTowardEnemyX),
    )
    const others = paddles.filter(
      (p) => !isPuckBehindPaddlePlanar(puckX, p.x, p.clearTowardEnemyX),
    )
    const byDist = (a: PaddleOverlap, b: PaddleOverlap) =>
      paddleOverlapDist(puckX, puckZ, a) - paddleOverlapDist(puckX, puckZ, b)
    return [...behindFirst.sort(byDist), ...others.sort(byDist)]
  }

  return [...paddles].sort(
    (a, b) =>
      paddleOverlapDist(puckX, puckZ, a) - paddleOverlapDist(puckX, puckZ, b),
  )
}

/** Resolve overlaps; prioriza raquete com disco “atrás” em sanduíche. */
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

  if (
    isCenterEngageZone(puck) &&
    paddles.length > 1 &&
    !anyBehind
  ) {
    const striker = pickCenterStriker(puck)
    const strikerIdx = paddles.findIndex((p) =>
      striker === 1 ? p.clearTowardEnemyX < 0 : p.clearTowardEnemyX > 0,
    )
    if (strikerIdx >= 0) list = [paddles[strikerIdx]]
  }

  const sorted = sortPaddlesForOverlap(puckX, puckZ, list)

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
