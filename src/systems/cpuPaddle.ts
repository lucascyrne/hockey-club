import {
  CPU_ATTACK_THRESHOLD_X,
  CPU_DEFENSE_X,
  CPU_LEAD_TIME,
  CPU_SPEED_FACTOR,
} from '../constants/cpu'
import { MAX_PADDLE_SPEED, PADDLE_PLAY_HALF_Z } from '../constants/paddle'
import type { PuckSample } from '../lib/puckTracker'
import type { PlayerId } from './bounds'
import { clampPaddlePosition } from './bounds'

const P1_DEFENSE_X = -CPU_DEFENSE_X
const P1_ATTACK_THRESHOLD_X = -CPU_ATTACK_THRESHOLD_X

const NEUTRAL_STALL_SPEED = 0.4
const NEUTRAL_STALL_X = 0.18
const NEUTRAL_DEFENSE_BLEND = 0.15

function isNeutralStall(puck: PuckSample): boolean {
  const speed = Math.hypot(puck.vx, puck.vz)
  return speed < NEUTRAL_STALL_SPEED && Math.abs(puck.x) < NEUTRAL_STALL_X
}

function blendDefenseX(puckX: number, defenseX: number): number {
  return puckX * (1 - NEUTRAL_DEFENSE_BLEND) + defenseX * NEUTRAL_DEFENSE_BLEND
}

export function computeCpuIdealTarget(
  playerId: PlayerId,
  puck: PuckSample,
): { x: number; z: number } {
  if (playerId === 2) {
    return computeCpuIdealTargetP2(puck)
  }
  return computeCpuIdealTargetP1(puck)
}

function computeCpuIdealTargetP2(puck: PuckSample): { x: number; z: number } {
  const predictedZ = puck.z + puck.vz * CPU_LEAD_TIME
  const targetZ = Math.max(
    -PADDLE_PLAY_HALF_Z,
    Math.min(PADDLE_PLAY_HALF_Z, predictedZ),
  )

  if (isNeutralStall(puck)) {
    return clampPaddlePosition(blendDefenseX(puck.x, CPU_DEFENSE_X), targetZ, 2)
  }

  const onCpuSide = puck.x < CPU_ATTACK_THRESHOLD_X
  const movingTowardP1 = puck.vx > 0.25
  const closeOnCpuHalf = puck.x < -0.35

  let targetX = CPU_DEFENSE_X

  if (onCpuSide || (puck.x < 0.08 && movingTowardP1)) {
    targetX = puck.x * 0.9 + CPU_DEFENSE_X * 0.1
    if (closeOnCpuHalf && movingTowardP1) {
      targetX = Math.min(-0.14, puck.x + 0.05)
    }
  }

  return clampPaddlePosition(targetX, targetZ, 2)
}

function computeCpuIdealTargetP1(puck: PuckSample): { x: number; z: number } {
  const predictedZ = puck.z + puck.vz * CPU_LEAD_TIME
  const targetZ = Math.max(
    -PADDLE_PLAY_HALF_Z,
    Math.min(PADDLE_PLAY_HALF_Z, predictedZ),
  )

  if (isNeutralStall(puck)) {
    return clampPaddlePosition(blendDefenseX(puck.x, P1_DEFENSE_X), targetZ, 1)
  }

  const onP1Side = puck.x > P1_ATTACK_THRESHOLD_X
  const movingTowardP2 = puck.vx < -0.25
  const closeOnP1Half = puck.x > 0.35

  let targetX = P1_DEFENSE_X

  if (onP1Side || (puck.x > -0.08 && movingTowardP2)) {
    targetX = puck.x * 0.9 + P1_DEFENSE_X * 0.1
    if (closeOnP1Half && movingTowardP2) {
      targetX = Math.max(0.14, puck.x - 0.05)
    }
  }

  return clampPaddlePosition(targetX, targetZ, 1)
}

/** Move o alvo da raquete CPU em direção ao ideal (limite de reação). */
export function stepCpuPaddleTarget(
  playerId: PlayerId,
  current: { x: number; z: number },
  ideal: { x: number; z: number },
  delta: number,
) {
  const maxStep = MAX_PADDLE_SPEED * CPU_SPEED_FACTOR * delta
  let dx = ideal.x - current.x
  let dz = ideal.z - current.z
  const dist = Math.hypot(dx, dz)

  if (dist > maxStep && dist > 1e-6) {
    dx = (dx / dist) * maxStep
    dz = (dz / dist) * maxStep
  }

  const next = clampPaddlePosition(current.x + dx, current.z + dz, playerId)
  current.x = next.x
  current.z = next.z
}
