import { CPU_ATTACK_THRESHOLD_X, CPU_DEFENSE_X } from '../constants/cpu'
import { PADDLE_PLAY_HALF_Z } from '../constants/paddle'
import type { CpuProfile } from '../lib/cpuDifficulty'
import { getPaddleMaxSpeed, getPaddleSpeedLevel } from '../lib/paddleFeel'
import type { PuckSample } from '../lib/puckTracker'
import {
  cpuMaxChaseX,
  puckThreatensCpuGoal,
  type CpuMode,
} from './cpuBehavior'
import type { PlayerId } from './bounds'
import { clampPaddlePosition } from './bounds'
import { applyPaddleStandoff } from './puckContact'
import { GOAL_LINE_X_NEG } from './rules'

const P1_DEFENSE_X = -CPU_DEFENSE_X
const P1_ATTACK_THRESHOLD_X = -CPU_ATTACK_THRESHOLD_X

const NEUTRAL_STALL_SPEED = 0.4
const NEUTRAL_STALL_X = 0.18

function isNeutralStall(puck: PuckSample): boolean {
  const speed = Math.hypot(puck.vx, puck.vz)
  return speed < NEUTRAL_STALL_SPEED && Math.abs(puck.x) < NEUTRAL_STALL_X
}

function clampZ(puck: PuckSample, leadTime: number) {
  const predictedZ = puck.z + puck.vz * leadTime
  return Math.max(-PADDLE_PLAY_HALF_Z, Math.min(PADDLE_PLAY_HALF_Z, predictedZ))
}

/** Nível ensino: aproxima para toque suave e devolve o disco para +X. */
function gentleReboundTarget(puck: PuckSample, profile: CpuProfile): {
  x: number
  z: number
} {
  const speed = Math.hypot(puck.vx, puck.vz)
  const targetZ = clampZ(puck, Math.max(profile.leadTime * 2.5, 0.12))

  let targetX = puck.x - 0.055

  if (speed < 0.75) {
    targetX = Math.min(puck.x + 0.05, CPU_DEFENSE_X + 0.2)
  } else if (puck.vx < -0.12) {
    targetX = Math.min(puck.x - 0.07, CPU_DEFENSE_X)
  }

  targetX = Math.min(CPU_DEFENSE_X + 0.22, targetX)
  targetX = Math.max(GOAL_LINE_X_NEG + 0.14, targetX)

  return { x: targetX, z: targetZ }
}

/** Posição entre o disco e o gol (−X), priorizando bloqueio em Z. */
function goalDefenseTarget(puck: PuckSample, profile: CpuProfile): {
  x: number
  z: number
} {
  const lead = profile.leadTime * (profile.attackAggression < 0.35 ? 2.2 : 1.4)
  const targetZ = clampZ(puck, lead)

  let targetX = Math.min(CPU_DEFENSE_X, puck.x - 0.1)

  if (puckThreatensCpuGoal(puck)) {
    targetX = Math.min(CPU_DEFENSE_X, puck.x - 0.14)
    if (puck.x < -0.5) {
      targetX = Math.min(CPU_DEFENSE_X, puck.x + 0.08)
    }
    targetX = Math.max(GOAL_LINE_X_NEG + 0.12, targetX)
  } else {
    targetX = CPU_DEFENSE_X * profile.defenseWeight + puck.x * (1 - profile.defenseWeight)
    targetX = Math.min(CPU_DEFENSE_X, targetX)
  }

  return { x: targetX, z: targetZ }
}

function attackChaseTarget(
  puck: PuckSample,
  profile: CpuProfile,
  defenseX: number,
): { x: number; z: number } {
  const targetZ = clampZ(puck, profile.leadTime)
  const chase = profile.attackAggression
  const maxX = cpuMaxChaseX()
  let targetX = puck.x * (0.5 + chase * 0.35) + defenseX * (0.5 - chase * 0.3)
  targetX = Math.min(maxX, targetX)

  if (puck.x < -0.35 && puck.vx > 0.2) {
    targetX = Math.min(maxX, puck.x + 0.04)
  }

  return { x: targetX, z: targetZ }
}

export function computeCpuIdealTarget(
  playerId: PlayerId,
  puck: PuckSample,
  profile: CpuProfile,
  mode: CpuMode = 'defend',
): { x: number; z: number } {
  const ideal =
    playerId === 2
      ? computeCpuIdealTargetP2(puck, profile, mode)
      : computeCpuIdealTargetP1(puck)
  if (playerId === 2 && profile.attackAggression < 0.35 && !puckThreatensCpuGoal(puck)) {
    return ideal
  }
  return applyPaddleStandoff(ideal.x, ideal.z, puck.x, puck.z, playerId)
}

function computeCpuIdealTargetP2(
  puck: PuckSample,
  profile: CpuProfile,
  mode: CpuMode,
): { x: number; z: number } {
  const defenseX = CPU_DEFENSE_X
  const threat = puckThreatensCpuGoal(puck)
  const speed = Math.hypot(puck.vx, puck.vz)
  const onCpuHalf = puck.x < CPU_ATTACK_THRESHOLD_X
  const isTutorial = profile.attackAggression < 0.35

  if (isNeutralStall(puck)) {
    const t = isTutorial ? gentleReboundTarget(puck, profile) : goalDefenseTarget(puck, profile)
    return clampPaddlePosition(t.x, t.z, 2)
  }

  if (isTutorial) {
    if (threat) {
      const t = goalDefenseTarget(puck, profile)
      return clampPaddlePosition(t.x, t.z, 2)
    }
    if (onCpuHalf && speed < 1.35) {
      const t = gentleReboundTarget(puck, profile)
      return clampPaddlePosition(t.x, t.z, 2)
    }
    const t = goalDefenseTarget(puck, profile)
    return clampPaddlePosition(t.x, t.z, 2)
  }

  const mustDefend = threat || mode === 'defend'

  if (mustDefend) {
    const t = goalDefenseTarget(puck, profile)
    return clampPaddlePosition(t.x, t.z, 2)
  }

  const t = attackChaseTarget(puck, profile, defenseX)
  return clampPaddlePosition(t.x, t.z, 2)
}

function computeCpuIdealTargetP1(puck: PuckSample): { x: number; z: number } {
  const targetZ = clampZ(puck, 0.1)

  if (isNeutralStall(puck)) {
    return clampPaddlePosition(P1_DEFENSE_X, targetZ, 1)
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

export function stepCpuPaddleTarget(
  playerId: PlayerId,
  current: { x: number; z: number },
  ideal: { x: number; z: number },
  delta: number,
  profile: CpuProfile,
) {
  const maxStep =
    getPaddleMaxSpeed(getPaddleSpeedLevel(playerId)) * profile.speedFactor * delta
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
