import {
  CPU_ATTACK_THRESHOLD_X,
  CPU_CENTER_ENGAGE_X,
  CPU_SLOW_PUCK_SPEED,
} from '../../constants/cpu'
import type { PuckSample } from '../../lib/puckTracker'
import type { PlayerId } from '../../systems/bounds'
import type { CpuConfig } from '../config'
import type { ThreatAssessment } from '../prediction/threat'
import {
  isDefensiveThird,
  puckThreatensPlayerGoal,
  threatTierAtLeast,
} from '../prediction/threat'
import type { CpuFsmContext, CpuFsmState } from './types'

function isOnOwnHalf(playerId: PlayerId, puck: PuckSample): boolean {
  return playerId === 2
    ? puck.x < CPU_ATTACK_THRESHOLD_X
    : puck.x > -CPU_ATTACK_THRESHOLD_X
}

function isSafeToDwell(puck: PuckSample, playerId: PlayerId): boolean {
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

export function updateClearTimer(
  ctx: CpuFsmContext,
  now: number,
  puck: PuckSample,
  config: CpuConfig,
  playerId: PlayerId,
) {
  if (isOnOwnHalf(playerId, puck)) {
    if (ctx.puckOnCpuHalfSince === 0) {
      ctx.puckOnCpuHalfSince = now
      const span = config.clearWindowMs.max - config.clearWindowMs.min
      ctx.forceClearAt =
        now + config.clearWindowMs.min + Math.random() * Math.max(0, span)
    }
  } else {
    ctx.puckOnCpuHalfSince = 0
    ctx.forceClearAt = 0
  }
}

function pickNextFsmState(
  puck: PuckSample,
  ctx: CpuFsmContext,
  now: number,
  config: CpuConfig,
  playerId: PlayerId,
  threat: ThreatAssessment,
): CpuFsmState {
  if (
    threat.critical ||
    puckThreatensPlayerGoal(puck, playerId) ||
    threatTierAtLeast(threat.tier, 'HIGH')
  ) {
    return 'intercept'
  }

  const speed = Math.hypot(puck.vx, puck.vz)
  const inDefensiveThird = isDefensiveThird(puck, playerId)
  const blockOffense =
    inDefensiveThird && threatTierAtLeast(threat.tier, 'MEDIUM')

  if (speed < CPU_SLOW_PUCK_SPEED && Math.abs(puck.x) < CPU_CENTER_ENGAGE_X) {
    if (blockOffense) return 'guard'
    return config.style === 'defensive' ? 'attack' : 'pressure'
  }

  if (now < ctx.modeLockedUntil) return ctx.fsmState

  const onOwn = isOnOwnHalf(playerId, puck)
  if (onOwn && ctx.forceClearAt > 0 && now >= ctx.forceClearAt && !blockOffense) {
    return 'clear'
  }

  if (now < ctx.fakeAttackUntil && !blockOffense) return 'pressure'

  const towardEnemy =
    playerId === 2 ? puck.vx > -0.25 : puck.vx < 0.25
  if (onOwn && speed < 2.2 && towardEnemy && !blockOffense) {
    return config.style === 'aggressive' || config.style === 'chaotic'
      ? 'pressure'
      : 'attack'
  }

  if (!onOwn) {
    if (
      threatTierAtLeast(threat.tier, 'MEDIUM') ||
      threat.goalPath.goalEntry !== null
    ) {
      return 'guard'
    }
    return 'track'
  }

  if (threatTierAtLeast(threat.tier, 'MEDIUM')) return 'guard'

  if (config.style === 'defensive' || config.style === 'professional') {
    return 'guard'
  }

  return 'guard'
}

export function updateCpuFsm(
  ctx: CpuFsmContext,
  now: number,
  puck: PuckSample,
  config: CpuConfig,
  playerId: PlayerId,
  threat: ThreatAssessment,
) {
  updateClearTimer(ctx, now, puck, config, playerId)

  const next = pickNextFsmState(puck, ctx, now, config, playerId, threat)

  if (next !== ctx.fsmState) {
    ctx.fsmState = next
    if (next === 'clear' || next === 'pressure') {
      ctx.modeLockedUntil = now + 280 + Math.random() * 260
    } else if (next === 'attack') {
      const inertiaMs = 150 + Math.random() * (config.attackAggression * 300)
      ctx.modeLockedUntil = now + inertiaMs
    } else if (next === 'recover') {
      ctx.modeLockedUntil = now + 220 + Math.random() * 180
    } else {
      ctx.modeLockedUntil = 0
    }
  }

  const speed = Math.hypot(puck.vx, puck.vz)
  const puckTowardOwn =
    playerId === 2 ? puck.vx < -0.25 : puck.vx > 0.25
  if (
    !config.dwellOnHalfMs ||
    !isSafeToDwell(puck, playerId) ||
    (speed < CPU_SLOW_PUCK_SPEED && Math.abs(puck.x) < CPU_CENTER_ENGAGE_X) ||
    threatTierAtLeast(threat.tier, 'MEDIUM') ||
    threat.goalPath.goalEntry !== null ||
    (threat.timeToGoal !== null && threat.timeToGoal < 0.6) ||
    puckTowardOwn
  ) {
    ctx.holdUntil = 0
    return
  }

  if (now < ctx.holdUntil) return

  const span = config.dwellOnHalfMs.max - config.dwellOnHalfMs.min
  ctx.holdUntil = now + config.dwellOnHalfMs.min + Math.random() * span
}

export function shouldHoldCpuPosition(
  ctx: CpuFsmContext,
  now: number,
  puck: PuckSample,
  config: CpuConfig,
  playerId: PlayerId,
  threat: ThreatAssessment,
): boolean {
  const onOwn = isOnOwnHalf(playerId, puck)
  const speed = Math.hypot(puck.vx, puck.vz)
  if (
    onOwn ||
    (speed < CPU_SLOW_PUCK_SPEED && Math.abs(puck.x) < CPU_CENTER_ENGAGE_X)
  ) {
    return false
  }
  if (!config.dwellOnHalfMs || puckThreatensPlayerGoal(puck, playerId)) {
    return false
  }
  if (threatTierAtLeast(threat.tier, 'MEDIUM')) return false
  if (threat.goalPath.goalEntry !== null) return false
  if (threat.timeToGoal !== null && threat.timeToGoal < 0.6) return false
  const puckTowardOwn = playerId === 2 ? puck.vx < -0.25 : puck.vx > 0.25
  if (puckTowardOwn) return false
  return now < ctx.holdUntil
}

/** Limite de avanço máximo baseado na agressividade do perfil. */
export function cpuMaxChaseX(aggression: number): number {
  if (aggression >= 0.9) return 0.05
  if (aggression >= 0.4) return -0.1
  return -0.3
}
