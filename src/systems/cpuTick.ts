import type { CpuProfile } from '../lib/cpuDifficulty'
import { getPuckSample, type PuckSample } from '../lib/puckTracker'
import { paddleTargets } from '../stores/paddleTargets'
import type { PlayerId } from './bounds'
import {
  createCpuBehaviorState,
  shouldHoldCpuPosition,
  updateCpuBehavior,
  type CpuBehaviorState,
} from './cpuBehavior'
import { isCpuYieldingCenter } from './cpuShared'
import { computeCpuIdealTarget, stepCpuPaddleTarget } from './cpuPaddle'

export type CpuTimingState = {
  delayedPuck: PuckSample
  lastPuckSampleAt: number
  error: { x: number; z: number }
  lastErrorAt: number
}

export function createCpuTimingState(): CpuTimingState {
  return {
    delayedPuck: getPuckSample(),
    lastPuckSampleAt: 0,
    error: { x: 0, z: 0 },
    lastErrorAt: 0,
  }
}

/** Um passo de IA por jogador — partilhado entre demo e VS CPU. */
export function tickCpuPlayer(
  playerId: PlayerId,
  state: CpuTimingState,
  behavior: CpuBehaviorState,
  profile: CpuProfile,
  now: number,
  delta: number,
) {
  if (now - state.lastPuckSampleAt >= profile.reactionMs) {
    state.delayedPuck = getPuckSample()
    state.lastPuckSampleAt = now
  }

  if (now - state.lastErrorAt >= profile.errorRefreshMs) {
    state.error = {
      x: (Math.random() - 0.5) * 2 * profile.errorHalf,
      z: (Math.random() - 0.5) * 2 * profile.errorHalf,
    }
    state.lastErrorAt = now
  }

  const puck = state.delayedPuck
  updateCpuBehavior(behavior, now, puck, profile, playerId)

  if (shouldHoldCpuPosition(behavior, now, puck, profile, playerId)) {
    return
  }

  const target = playerId === 1 ? paddleTargets.p1 : paddleTargets.p2
  const ideal = computeCpuIdealTarget(
    playerId,
    puck,
    profile,
    behavior.mode,
    target,
  )

  const nearPuck = Math.hypot(target.x - puck.x, target.z - puck.z) < 0.16
  const yielding = isCpuYieldingCenter(playerId, puck)
  const err = nearPuck || yielding ? { x: 0, z: 0 } : state.error

  stepCpuPaddleTarget(
    playerId,
    target,
    { x: ideal.x + err.x, z: ideal.z + err.z },
    delta,
    profile,
  )
}

export { createCpuBehaviorState, type CpuBehaviorState }
