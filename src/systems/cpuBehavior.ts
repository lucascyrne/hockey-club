import { GOAL_HALF_WIDTH } from '../constants/game'
import {
  CPU_ATTACK_THRESHOLD_X,
  CPU_CENTER_ENGAGE_X,
  CPU_DEFENSE_X,
  CPU_SLOW_PUCK_SPEED,
} from '../constants/cpu'
import type { CpuProfile } from '../lib/cpuDifficulty'
import type { PuckSample } from '../lib/puckTracker'
import { GOAL_LINE_X_NEG, GOAL_LINE_X_POS } from './rules'
import type { PlayerId } from './bounds'

export type CpuMode = 'attack' | 'defend' | 'press'

export type CpuBehaviorState = {
  holdUntil: number
  mode: CpuMode
  /** Inércia de postura: não alterna antes deste timestamp. */
  modeLockedUntil: number
  puckOnCpuHalfSince: number
  forceClearAt: number
}

const THREAT_LEAD_S = 0.45

/** Limite de avanço máximo baseado na agressividade do perfil. */
export function cpuMaxChaseX(aggression: number): number {
  if (aggression >= 0.9) return 0.05   // nível 3: pressiona até o campo inimigo
  if (aggression >= 0.4) return -0.1   // nível 2: passa ligeiramente do centro
  return -0.3                           // nível 1: fica no próprio campo
}

export function cpuDefenseAnchorX() {
  return CPU_DEFENSE_X
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

/** Disco a caminho do gol de P1 (+X). */
export function puckThreatensP1Goal(puck: PuckSample): boolean {
  const speed = Math.hypot(puck.vx, puck.vz)
  const inMouth = Math.abs(puck.z) < GOAL_HALF_WIDTH * 1.15
  const predX = puck.x + puck.vx * THREAT_LEAD_S

  if (puck.x >= GOAL_LINE_X_POS - 0.08 && inMouth) return true
  if (inMouth && puck.x > 0.38 && puck.vx > 0.12) return true
  if (predX > 0.62 && puck.vx > 0.25) return true
  if (puck.x > 0.2 && puck.vx > 0.55 && speed > 0.8) return true
  if (puck.x > -0.05 && puck.vx > 1.2) return true

  return false
}

export function puckThreatensPlayerGoal(
  puck: PuckSample,
  playerId: PlayerId,
): boolean {
  return playerId === 2 ? puckThreatensCpuGoal(puck) : puckThreatensP1Goal(puck)
}

/** Pausa "pensando" só quando o disco não ameaça o gol. */
export function isSafeToDwell(puck: PuckSample, playerId: PlayerId): boolean {
  if (puckThreatensPlayerGoal(puck, playerId)) return false
  if (playerId === 2) {
    if (puck.x > 0.12) return true
    if (puck.x < CPU_ATTACK_THRESHOLD_X && puck.vx > 0.2) return true
    const speed = Math.hypot(puck.vx, puck.vz)
    return puck.x < 0.05 && speed < 1.1 && puck.vx > -0.35
  }
  if (puck.x < -0.12) return true
  if (puck.x > -CPU_ATTACK_THRESHOLD_X && puck.vx < -0.2) return true
  const speed = Math.hypot(puck.vx, puck.vz)
  return puck.x > -0.05 && speed < 1.1 && puck.vx < 0.35
}

export function createCpuBehaviorState(): CpuBehaviorState {
  return {
    holdUntil: 0,
    mode: 'defend',
    modeLockedUntil: 0,
    puckOnCpuHalfSince: 0,
    forceClearAt: 0,
  }
}

function pickCpuMode(
  puck: PuckSample,
  state: CpuBehaviorState,
  now: number,
  playerId: PlayerId,
): CpuMode {
  if (puckThreatensPlayerGoal(puck, playerId)) return 'defend'

  const speed = Math.hypot(puck.vx, puck.vz)
  if (speed < CPU_SLOW_PUCK_SPEED && Math.abs(puck.x) < CPU_CENTER_ENGAGE_X) {
    return 'attack'
  }

  if (now < state.modeLockedUntil) return state.mode

  const onOwnHalf =
    playerId === 2
      ? puck.x < CPU_ATTACK_THRESHOLD_X
      : puck.x > -CPU_ATTACK_THRESHOLD_X

  if (onOwnHalf && state.forceClearAt > 0 && now >= state.forceClearAt) {
    return 'press'
  }

  const towardEnemy =
    playerId === 2 ? puck.vx > -0.25 : puck.vx < 0.25
  if (onOwnHalf && speed < 2.2 && towardEnemy) return 'attack'
  return 'defend'
}

export function updateCpuBehavior(
  state: CpuBehaviorState,
  now: number,
  puck: PuckSample,
  profile: CpuProfile,
  playerId: PlayerId,
) {
  const speed = Math.hypot(puck.vx, puck.vz)
  const onOwnHalf =
    playerId === 2
      ? puck.x < CPU_ATTACK_THRESHOLD_X
      : puck.x > -CPU_ATTACK_THRESHOLD_X
  if (onOwnHalf) {
    if (state.puckOnCpuHalfSince === 0) {
      state.puckOnCpuHalfSince = now
      const span = profile.clearWindowMs.max - profile.clearWindowMs.min
      state.forceClearAt =
        now + profile.clearWindowMs.min + Math.random() * Math.max(0, span)
    }
  } else {
    state.puckOnCpuHalfSince = 0
    state.forceClearAt = 0
  }

  const newMode = pickCpuMode(puck, state, now, playerId)

  if (newMode !== state.mode) {
    state.mode = newMode
    // Press/attack mantém postura por curto período; defesa segue rápida.
    if (newMode === 'press') {
      state.modeLockedUntil = now + 280 + Math.random() * 260
    } else if (newMode === 'attack') {
      const inertiaMs = 150 + Math.random() * (profile.attackAggression * 300)
      state.modeLockedUntil = now + inertiaMs
    } else {
      state.modeLockedUntil = 0
    }
  }

  if (
    !profile.dwellOnHalfMs ||
    !isSafeToDwell(puck, playerId) ||
    (speed < CPU_SLOW_PUCK_SPEED && Math.abs(puck.x) < CPU_CENTER_ENGAGE_X)
  ) {
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
  playerId: PlayerId,
): boolean {
  const onOwnHalf =
    playerId === 2
      ? puck.x < CPU_ATTACK_THRESHOLD_X
      : puck.x > -CPU_ATTACK_THRESHOLD_X
  const speed = Math.hypot(puck.vx, puck.vz)
  if (
    onOwnHalf ||
    (speed < CPU_SLOW_PUCK_SPEED && Math.abs(puck.x) < CPU_CENTER_ENGAGE_X)
  ) {
    return false
  }
  if (!profile.dwellOnHalfMs || puckThreatensPlayerGoal(puck, playerId)) {
    return false
  }
  return now < state.holdUntil
}
