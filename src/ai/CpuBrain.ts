import type { CpuDifficulty, CpuProfile } from '../lib/cpuDifficulty'
import { getPuckSample, type PuckSample } from '../lib/puckTracker'
import { isCpuDebugActive } from '../stores/cpuDebugStore'
import { paddleTargets } from '../stores/paddleTargets'
import type { PlayerId } from '../systems/bounds'
import { isCpuYieldingCenter } from '../systems/cpuShared'
import { pushCpuDebugFrame } from './debug/frameLog'
import { resolveCpuConfig, type CpuConfig } from './config'
import { stepCpuPaddleTarget, applyExecutionError } from './actuation/actuator'
import { setCpuStrikeProfile } from './actuation/strikeProfile'
import {
  isPuckBehindPaddle,
  resolveStableEngageTarget,
} from './planning/engageGeometry'
import { shouldHoldCpuPosition, updateCpuFsm } from './fsm/transitions'
import {
  createCpuFsmContext,
  fsmToLegacyMode,
  type CpuFsmContext,
} from './fsm/types'
import { buildPerceptionSnapshot } from './perception/sense'
import { evaluateThreat } from './prediction/threat'
import { finalizeIdealTarget } from './planning/positioning'
import { pickSafeTarget } from './planning/safety'
import { planIntent } from './planning/tactics'

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

export type CpuBehaviorState = CpuFsmContext & {
  mode: ReturnType<typeof fsmToLegacyMode>
}

export function createCpuBehaviorState(): CpuBehaviorState {
  const ctx = createCpuFsmContext()
  return { ...ctx, mode: fsmToLegacyMode(ctx.fsmState) }
}

function syncLegacyMode(behavior: CpuBehaviorState) {
  behavior.mode = fsmToLegacyMode(behavior.fsmState)
}

export type TickCpuOptions = {
  demoMode?: boolean
}

export function tickCpuPlayer(
  playerId: PlayerId,
  timing: CpuTimingState,
  behavior: CpuBehaviorState,
  profile: CpuProfile,
  difficulty: CpuDifficulty,
  now: number,
  delta: number,
  options?: TickCpuOptions,
) {
  const demoMode = options?.demoMode === true
  const config: CpuConfig = resolveCpuConfig(difficulty, profile)

  if (now - timing.lastPuckSampleAt >= config.reactionMs) {
    timing.delayedPuck = getPuckSample()
    timing.lastPuckSampleAt = now
  }

  if (
    !demoMode &&
    now - timing.lastErrorAt >= config.errorRefreshMs
  ) {
    const err = config.executionErrorM
    timing.error = {
      x: (Math.random() - 0.5) * 2 * err,
      z: (Math.random() - 0.5) * 2 * err,
    }
    timing.lastErrorAt = now
  }

  const puck = timing.delayedPuck
  const snap = buildPerceptionSnapshot(
    playerId,
    puck,
    now,
    timing.lastPuckSampleAt,
  )
  const threat = evaluateThreat(
    snap,
    playerId,
    config.predictionHorizonS,
    config.maxBounceReflections,
  )

  updateCpuFsm(behavior, now, puck, config, playerId, threat)
  syncLegacyMode(behavior)

  if (shouldHoldCpuPosition(behavior, now, puck, config, playerId, threat)) {
    return
  }

  const target = playerId === 1 ? paddleTargets.p1 : paddleTargets.p2
  const intent = planIntent(
    snap,
    config,
    behavior,
    playerId,
    now,
    threat,
    target,
  )

  let ideal = finalizeIdealTarget(
    playerId,
    puck,
    config,
    behavior.fsmState,
    intent.target,
    target,
    demoMode,
  )

  const nearPuck = Math.hypot(target.x - puck.x, target.z - puck.z) < 0.16
  const yielding = isCpuYieldingCenter(playerId, puck, demoMode)
  const slip =
    !demoMode && Math.random() < config.slipChance * 0.02

  if (!demoMode) {
    ideal = applyExecutionError(ideal, timing.error, nearPuck, yielding, slip)
  }

  const safe = pickSafeTarget(
    puck,
    ideal,
    threat,
    playerId,
    snap.ownGoal.lineX,
    behavior.fsmState,
    demoMode,
  )
  ideal = safe.target

  ideal = resolveStableEngageTarget(
    puck,
    target,
    playerId,
    ideal,
    now,
    behavior,
    demoMode,
  )

  const isStrike =
    intent.action.includes('Strike') ||
    intent.action === 'clear' ||
    intent.action === 'centerStrike'
  setCpuStrikeProfile(1 + 0.25 * intent.urgency, isStrike)

  if (isCpuDebugActive()) {
    pushCpuDebugFrame({
      timestamp: now,
      playerId,
      state: behavior.fsmState,
      puckPosition: { x: puck.x, z: puck.z },
      puckVelocity: { x: puck.vx, z: puck.vz },
      predictedPath: threat.goalPath,
      threatLevel: threat.score,
      threatTier: threat.tier,
      chosenAction: safe.usedFallback ? `${intent.action}+safe` : intent.action,
      targetPosition: ideal,
      interceptPoint: intent.interceptPoint,
      goalEntryZ: threat.goalEntryZ,
      ownGoalRisk: safe.ownGoalRisk,
    })
  }

  const puckBehind = isPuckBehindPaddle(puck, target, playerId)
  let moveUrgency = intent.urgency
  const paddlePuckDist = Math.hypot(target.x - puck.x, target.z - puck.z)
  if (puckBehind) {
    moveUrgency = Math.min(1, moveUrgency + 0.35)
  }

  stepCpuPaddleTarget(
    playerId,
    target,
    ideal,
    delta,
    config,
    intent.burst,
    moveUrgency,
    puck.x,
    puck.z,
    paddlePuckDist,
    puckBehind,
  )
}

export type { CpuFsmContext } from './fsm/types'
export { createCpuFsmContext } from './fsm/types'
