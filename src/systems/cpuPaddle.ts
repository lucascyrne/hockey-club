import {
  CPU_ATTACK_THRESHOLD_X,
  CPU_DEFENSE_X,
  CPU_SLOW_PUCK_SPEED,
} from '../constants/cpu'
import {
  PADDLE_P1_X_MAX,
  PADDLE_PLAY_HALF_Z,
} from '../constants/paddle'
import type { CpuProfile } from '../lib/cpuDifficulty'
import { getPaddleMaxSpeed, getPaddleSpeedLevel } from '../lib/paddleFeel'
import type { PuckSample } from '../lib/puckTracker'
import {
  puckThreatensPlayerGoal,
  type CpuMode,
} from './cpuBehavior'
import type { PlayerId } from './bounds'
import { clampPaddlePosition } from './bounds'
import { applyPaddleStandoff, PUCK_PADDLE_MIN_DIST } from './puckContact'
import { GOAL_LINE_X_NEG } from './rules'
import { TABLE_PLAY_HALF_X, TABLE_PLAY_HALF_Z } from '../constants/physics'
import {
  getCenterYieldTarget,
  isCenterEngageZone,
  pickCenterStriker,
} from './cpuShared'

const P1_DEFENSE_X = -CPU_DEFENSE_X
const P1_ATTACK_THRESHOLD_X = -CPU_ATTACK_THRESHOLD_X

const CPU_MAX_ADVANCE_X = -0.12
const CPU_MAX_ADVANCE_SLOW_X = 0.05

function isPuckSlow(puck: PuckSample): boolean {
  return Math.hypot(puck.vx, puck.vz) < CPU_SLOW_PUCK_SPEED
}

/** Disco no próprio campo ou na zona neutra lenta (centro). */
function canEngagePuck(playerId: PlayerId, puck: PuckSample): boolean {
  const onOwnHalf =
    playerId === 2
      ? puck.x < CPU_ATTACK_THRESHOLD_X
      : puck.x > P1_ATTACK_THRESHOLD_X
  return onOwnHalf || isCenterEngageZone(puck)
}

function clampZ(z: number): number {
  return Math.max(-PADDLE_PLAY_HALF_Z, Math.min(PADDLE_PLAY_HALF_Z, z))
}

function predictedZ(puck: PuckSample, lead: number): number {
  return clampZ(puck.z + puck.vz * lead)
}

/** Raquete posicionada “atrás” do disco para empurrar em direção ao gol adversário. */
function attackPaddleX(puck: PuckSample, playerId: PlayerId, slow: boolean): number {
  const offset = slow ? 0.08 : 0.05
  if (playerId === 2) {
    const maxX = slow ? CPU_MAX_ADVANCE_SLOW_X : CPU_MAX_ADVANCE_X
    return Math.max(GOAL_LINE_X_NEG + 0.12, Math.min(maxX, puck.x - offset))
  }
  return Math.min(PADDLE_P1_X_MAX, Math.max(0.08, puck.x + offset))
}

function puckMovingTowardOwnGoal(puck: PuckSample, playerId: PlayerId): boolean {
  return playerId === 2 ? puck.vx < -0.2 : puck.vx > 0.2
}

function isPuckOnWall(puck: PuckSample): boolean {
  return (
    Math.abs(puck.z) >= TABLE_PLAY_HALF_Z - 0.035 ||
    Math.abs(puck.x) >= TABLE_PLAY_HALF_X - 0.035
  )
}

/** Lado Z estável para varrimento — não alterna quando a raquete cruza o disco. */
function sweepSideZ(playerId: PlayerId, puck: PuckSample): number {
  const base = playerId === 2 ? -1 : 1
  return puck.z >= 0 ? -base : base
}

function gentleReboundTarget(puck: PuckSample, profile: CpuProfile): { x: number; z: number } {
  const speed = Math.hypot(puck.vx, puck.vz)
  const tz = predictedZ(puck, Math.max(profile.leadTime * 2.5, 0.12))
  let tx = puck.x - 0.055
  if (speed < 0.75) tx = Math.min(puck.x + 0.05, CPU_DEFENSE_X + 0.2)
  else if (puck.vx < -0.12) tx = Math.min(puck.x - 0.07, CPU_DEFENSE_X)
  tx = Math.min(CPU_DEFENSE_X + 0.22, Math.max(GOAL_LINE_X_NEG + 0.14, tx))
  return { x: tx, z: tz }
}

function goalDefenseTarget(
  puck: PuckSample,
  profile: CpuProfile,
  playerId: PlayerId,
): { x: number; z: number } {
  const lead = profile.leadTime * (profile.attackAggression < 0.35 ? 2.2 : 1.6)
  const tz = predictedZ(puck, lead)

  if (playerId === 2) {
    let tx: number
    if (puckThreatensPlayerGoal(puck, 2)) {
      tx = Math.min(CPU_DEFENSE_X, puck.x - 0.14)
      if (puck.x < -0.5) tx = Math.min(CPU_DEFENSE_X, puck.x + 0.08)
      tx = Math.max(GOAL_LINE_X_NEG + 0.12, tx)
    } else {
      tx = CPU_DEFENSE_X * profile.defenseWeight + puck.x * (1 - profile.defenseWeight)
      tx = Math.min(CPU_DEFENSE_X, tx)
    }
    return { x: tx, z: tz }
  }

  let tx: number
  if (puckThreatensPlayerGoal(puck, 1)) {
    tx = Math.max(P1_DEFENSE_X, puck.x + 0.14)
    tx = Math.min(PADDLE_P1_X_MAX, tx)
  } else {
    tx = P1_DEFENSE_X * profile.defenseWeight + puck.x * (1 - profile.defenseWeight)
    tx = Math.max(P1_DEFENSE_X, tx)
  }
  return { x: tx, z: tz }
}

function sweepTarget(
  puck: PuckSample,
  paddle: { x: number; z: number },
  playerId: PlayerId,
): { x: number; z: number } | null {
  if (!isPuckSlow(puck)) return null

  const dist = Math.hypot(paddle.x - puck.x, paddle.z - puck.z)
  const overshot =
    playerId === 2 ? paddle.x < puck.x - 0.03 : paddle.x > puck.x + 0.03
  const parallel =
    dist < PUCK_PADDLE_MIN_DIST * 1.15 && Math.abs(paddle.z - puck.z) < 0.06
  const nearStuck =
    dist < PUCK_PADDLE_MIN_DIST * 1.35 &&
    (isCenterEngageZone(puck) || isPuckOnWall(puck) || isPuckSlow(puck))

  if (!overshot && !parallel && !nearStuck) return null

  const side = sweepSideZ(playerId, puck)
  const retreatX = playerId === 2 ? puck.x - 0.14 : puck.x + 0.14
  return clampPaddlePosition(retreatX, clampZ(puck.z + side * 0.2), playerId)
}

function attackTarget(
  puck: PuckSample,
  profile: CpuProfile,
  playerId: PlayerId,
): { x: number; z: number } {
  const slow = isPuckSlow(puck)
  const tx = attackPaddleX(puck, playerId, slow)

  let tz: number
  if (slow) {
    if (isPuckOnWall(puck)) {
      if (Math.abs(puck.z) >= TABLE_PLAY_HALF_Z - 0.035) {
        tz = clampZ(puck.z - Math.sign(puck.z) * 0.12)
      } else {
        tz = clampZ(puck.z + sweepSideZ(playerId, puck) * 0.07)
      }
    } else {
      const offset = sweepSideZ(playerId, puck) * 0.07
      tz = clampZ(puck.z + offset)
    }
  } else {
    const wallTarget = puck.z > 0 ? -PADDLE_PLAY_HALF_Z * 0.8 : PADDLE_PLAY_HALF_Z * 0.8
    tz = clampZ(puck.z + (wallTarget - puck.z) * profile.wallBias * 0.5)
  }

  return { x: tx, z: tz }
}

function forcedClearTarget(
  puck: PuckSample,
  profile: CpuProfile,
  playerId: PlayerId,
): { x: number; z: number } {
  const tx = attackPaddleX(puck, playerId, false)
  const side = puck.z >= 0 ? -1 : 1
  const wallMag = PADDLE_PLAY_HALF_Z * (0.55 + profile.wallBias * 0.35)
  return { x: tx, z: clampZ(puck.z + side * wallMag) }
}

function computeIdeal(
  playerId: PlayerId,
  puck: PuckSample,
  profile: CpuProfile,
  mode: CpuMode,
  paddleCurrent?: { x: number; z: number },
): { x: number; z: number } {
  if (paddleCurrent) {
    const sweep = sweepTarget(puck, paddleCurrent, playerId)
    if (sweep) return clampPaddlePosition(sweep.x, sweep.z, playerId)
  }

  if (isCenterEngageZone(puck)) {
    if (pickCenterStriker(puck) !== playerId) {
      return getCenterYieldTarget(playerId, puck)
    }
    if (
      !puckThreatensPlayerGoal(puck, playerId) &&
      !puckMovingTowardOwnGoal(puck, playerId)
    ) {
      const side = sweepSideZ(playerId, puck)
      const tx = attackPaddleX(puck, playerId, true)
      const tz = clampZ(puck.z + side * 0.22)
      return clampPaddlePosition(tx, tz, playerId)
    }
  }

  if (puckThreatensPlayerGoal(puck, playerId)) {
    return clampPaddlePosition(
      ...asTuple(goalDefenseTarget(puck, profile, playerId)),
      playerId,
    )
  }

  const isTutorial = profile.attackAggression < 0.35
  if (playerId === 2 && isTutorial) {
    const speed = Math.hypot(puck.vx, puck.vz)
    if (puck.x < CPU_ATTACK_THRESHOLD_X && speed < 1.35) {
      return clampPaddlePosition(...asTuple(gentleReboundTarget(puck, profile)), 2)
    }
    return clampPaddlePosition(...asTuple(goalDefenseTarget(puck, profile, 2)), 2)
  }

  const towardEnemy =
    playerId === 2 ? puck.vx > -0.15 : puck.vx < 0.15

  if (
    isPuckSlow(puck) &&
    canEngagePuck(playerId, puck) &&
    towardEnemy &&
    !puckMovingTowardOwnGoal(puck, playerId)
  ) {
    return clampPaddlePosition(...asTuple(attackTarget(puck, profile, playerId)), playerId)
  }

  if (
    (mode === 'defend' || puckMovingTowardOwnGoal(puck, playerId)) &&
    !canEngagePuck(playerId, puck)
  ) {
    return clampPaddlePosition(...asTuple(goalDefenseTarget(puck, profile, playerId)), playerId)
  }

  if (mode === 'press' && !puckMovingTowardOwnGoal(puck, playerId)) {
    return clampPaddlePosition(...asTuple(forcedClearTarget(puck, profile, playerId)), playerId)
  }

  return clampPaddlePosition(...asTuple(attackTarget(puck, profile, playerId)), playerId)
}

export function computeCpuIdealTarget(
  playerId: PlayerId,
  puck: PuckSample,
  profile: CpuProfile,
  mode: CpuMode = 'defend',
  paddleCurrent?: { x: number; z: number },
): { x: number; z: number } {
  const ideal = computeIdeal(playerId, puck, profile, mode, paddleCurrent)
  const slowPuck = isPuckSlow(puck)
  const skipStandoff =
    slowPuck ||
    (playerId === 2 &&
      (mode !== 'defend' ||
        (profile.attackAggression < 0.35 && !puckThreatensPlayerGoal(puck, 2))))

  if (skipStandoff) return ideal
  return applyPaddleStandoff(ideal.x, ideal.z, puck.x, puck.z, playerId)
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
  if (dist < 0.008) return
  if (dist > maxStep && dist > 1e-6) {
    dx = (dx / dist) * maxStep
    dz = (dz / dist) * maxStep
  }
  const next = clampPaddlePosition(current.x + dx, current.z + dz, playerId)
  current.x = next.x
  current.z = next.z
}

function asTuple(p: { x: number; z: number }): [number, number] {
  return [p.x, p.z]
}
