import { GOAL_HALF_WIDTH } from '../constants/game'
import { CPU_ATTACK_THRESHOLD_X, CPU_DEFENSE_X } from '../constants/cpu'
import type { CpuProfile } from '../lib/cpuDifficulty'
import type { PuckSample } from '../lib/puckTracker'
import { GOAL_LINE_X_NEG } from './rules'

export type CpuMode = 'attack' | 'defend'

export type CpuBehaviorState = {
  holdUntil: number
  mode: CpuMode
}

const THREAT_LEAD_S = 0.45
const CPU_MAX_CHASE_X = -0.24

export function createCpuBehaviorState(): CpuBehaviorState {
  return { holdUntil: 0, mode: 'defend' }
}

export function cpuDefenseAnchorX() {
  return CPU_DEFENSE_X
}

export function cpuMaxChaseX() {
  return CPU_MAX_CHASE_X
}

/** Disco a caminho do gol da CPU (−X) ou já perigoso no corredor. */
export function puckThreatensCpuGoal(puck: PuckSample): boolean {
  const speed = Math.hypot(puck.vx, puck.vz)
  const inMouth = Math.abs(puck.z) < GOAL_HALF_WIDTH * 1.15
  const predX = puck.x + puck.vx * THREAT_LEAD_S

  if (puck.x <= GOAL_LINE_X_NEG + 0.08 && inMouth) return true
  if (inMouth && puck.x < -0.38 && puck.vx < -0.12) return true
  if (predX < -0.62 && puck.vx < -0.25) return true
  if (puck.x < -0.2 && puck.vx < -0.55 && speed > 0.8) return true
  if (puck.x < 0.05 && puck.vx < -1.2) return true

  return false
}

/** Pausa “pensando” só quando o disco não ameaça o gol. */
export function isSafeToDwell(puck: PuckSample): boolean {
  if (puckThreatensCpuGoal(puck)) return false
  if (puck.x > 0.12) return true
  if (puck.x < CPU_ATTACK_THRESHOLD_X && puck.vx > 0.2) return true
  const speed = Math.hypot(puck.vx, puck.vz)
  return puck.x < 0.05 && speed < 1.1 && puck.vx > -0.35
}

export function pickCpuMode(puck: PuckSample, profile: CpuProfile): CpuMode {
  if (profile.dwellOnHalfMs === null) {
    if (puckThreatensCpuGoal(puck)) return 'defend'
    const speed = Math.hypot(puck.vx, puck.vz)
    if (puck.x < CPU_ATTACK_THRESHOLD_X && speed < 1.2 && puck.vx > -0.2) return 'attack'
    return 'defend'
  }

  if (puckThreatensCpuGoal(puck)) return 'defend'
  if (puck.x > 0.08) return 'defend'

  const speed = Math.hypot(puck.vx, puck.vz)
  const onCpuHalf = puck.x < CPU_ATTACK_THRESHOLD_X
  const movingAway = puck.vx > 0.15

  if (profile.attackAggression < 0.35) {
    if (onCpuHalf && !movingAway && speed < 0.85 && puck.x < -0.42) return 'attack'
    return 'defend'
  }

  if (onCpuHalf && !movingAway && speed < 1.35 && puck.vx > -0.25 && isSafeToDwell(puck)) {
    return 'attack'
  }

  return 'defend'
}

export function updateCpuBehavior(
  state: CpuBehaviorState,
  now: number,
  puck: PuckSample,
  profile: CpuProfile,
) {
  state.mode = pickCpuMode(puck, profile)

  if (profile.attackAggression < 0.35 && puck.x < CPU_ATTACK_THRESHOLD_X) {
    const speed = Math.hypot(puck.vx, puck.vz)
    if (speed < 0.8) {
      state.holdUntil = 0
    }
  }

  if (!profile.dwellOnHalfMs || !isSafeToDwell(puck)) {
    state.holdUntil = 0
    return
  }

  if (now < state.holdUntil) return

  const span = profile.dwellOnHalfMs.max - profile.dwellOnHalfMs.min
  state.holdUntil = now + profile.dwellOnHalfMs.min + Math.random() * span
}

export function shouldHoldCpuPosition(
  state: CpuBehaviorState,
  now: number,
  puck: PuckSample,
  profile: CpuProfile,
): boolean {
  if (!profile.dwellOnHalfMs || puckThreatensCpuGoal(puck)) return false
  return now < state.holdUntil
}
