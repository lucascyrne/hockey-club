import { PADDLE_PLAY_HALF_Z } from '../../constants/paddle'
import type { CpuConfig } from '../config'
import type { CpuFsmContext } from '../fsm/types'
import { buildPuckPath, type PredictedPuckPath } from '../prediction/puckPath'
import type { ThreatAssessment } from '../prediction/threat'
import { isDefensiveThird, threatTierAtLeast } from '../prediction/threat'
import type { PuckSample } from '../../lib/puckTracker'
import type { PlayerId } from '../../systems/bounds'
import { clampPaddlePosition } from '../../systems/bounds'
import type { PerceptionSnapshot } from '../perception/types'
import type { Vec2 } from '../types'
import { attackPaddleX, attackTarget, planPositionTarget } from './positioning'

export type CpuIntent = {
  target: Vec2
  urgency: number
  useBank: boolean
  burst: boolean
  action: string
  interceptPoint: Vec2 | null
}

function clampZ(z: number): number {
  return Math.max(-PADDLE_PLAY_HALF_Z, Math.min(PADDLE_PLAY_HALF_Z, z))
}

function blockRiskyOffense(
  puck: PuckSample,
  playerId: PlayerId,
  threat: ThreatAssessment,
): boolean {
  return (
    isDefensiveThird(puck, playerId) &&
    threatTierAtLeast(threat.tier, 'MEDIUM')
  )
}

export function bankShotTarget(
  puck: PuckSample,
  config: CpuConfig,
  playerId: PlayerId,
  path: PredictedPuckPath,
): Vec2 | null {
  if (config.maxBounceReflections < 1 || config.bankShotChance <= 0) return null
  if (path.points.length < 2) return null

  const towardEnemy = playerId === 2 ? puck.vx > 0 : puck.vx < 0
  if (!towardEnemy && Math.hypot(puck.vx, puck.vz) > 1.5) return null

  const wallZ = puck.z >= 0 ? PADDLE_PLAY_HALF_Z * 0.82 : -PADDLE_PLAY_HALF_Z * 0.82
  const afterBounce = path.points[Math.min(2, path.points.length - 1)]
  const tx = attackPaddleX(puck, playerId, false, config)
  const tz = clampZ((wallZ + afterBounce.z) * 0.5)
  return clampPaddlePosition(tx, tz, playerId)
}

export function maybeStartFakeAttack(
  ctx: CpuFsmContext,
  now: number,
  config: CpuConfig,
  puck: PuckSample,
  playerId: PlayerId,
  threat: ThreatAssessment,
): void {
  if (blockRiskyOffense(puck, playerId, threat)) return
  if (config.fakeAttackChance <= 0) return
  if (now < ctx.fakeAttackUntil) return
  if (Math.random() > config.fakeAttackChance * 0.02) return

  const onPressSide = playerId === 2 ? puck.x < 0.05 : puck.x > -0.05
  if (!onPressSide) return

  ctx.fakeAttackUntil = now + 180 + Math.random() * 120
  ctx.fsmState = 'pressure'
}

export function fakeAttackTarget(
  puck: PuckSample,
  config: CpuConfig,
  playerId: PlayerId,
): Vec2 {
  const tx = attackPaddleX(puck, playerId, true, config)
  return clampPaddlePosition(tx, clampZ(puck.z), playerId)
}

export function maybeStartBurst(
  ctx: CpuFsmContext,
  now: number,
  config: CpuConfig,
  puck: PuckSample,
  playerId: PlayerId,
  threat: ThreatAssessment,
): void {
  if (blockRiskyOffense(puck, playerId, threat)) return
  if (now < ctx.burstUntil) return
  if (now - ctx.lastBurstAt < config.burstCooldownMs) return
  if (config.style !== 'aggressive' && config.style !== 'chaotic') return
  if (Math.random() > 0.008) return

  ctx.burstUntil = now + config.burstDurationMs
  ctx.lastBurstAt = now
}

export function isBurstActive(ctx: CpuFsmContext, now: number): boolean {
  return now < ctx.burstUntil
}

export function planIntent(
  snap: PerceptionSnapshot,
  config: CpuConfig,
  ctx: CpuFsmContext,
  playerId: PlayerId,
  now: number,
  threat: ThreatAssessment,
  paddleCurrent?: Vec2,
): CpuIntent {
  const puck = snap.puckSample
  maybeStartFakeAttack(ctx, now, config, puck, playerId, threat)
  maybeStartBurst(ctx, now, config, puck, playerId, threat)

  const path = buildPuckPath(
    puck,
    config.predictionHorizonS,
    config.maxBounceReflections,
    snap.walls.halfX,
    snap.walls.halfZ,
  )

  let target: Vec2
  let useBank = false
  let action = 'plan'
  let interceptPoint: Vec2 | null = null

  if (now < ctx.fakeAttackUntil && ctx.fsmState === 'pressure') {
    target = fakeAttackTarget(puck, config, playerId)
    return {
      target,
      urgency: 0.7,
      useBank: false,
      burst: isBurstActive(ctx, now),
      action: 'fakeAttack',
      interceptPoint: null,
    }
  }

  const risky = blockRiskyOffense(puck, playerId, threat)
  const bank =
    !risky &&
    (ctx.fsmState === 'attack' || ctx.fsmState === 'pressure') &&
    Math.random() < config.bankShotChance * 0.15
      ? bankShotTarget(puck, config, playerId, path)
      : null

  if (bank) {
    target = bank
    useBank = true
    action = 'bankShot'
  } else {
    const plan = planPositionTarget({
      playerId,
      puck,
      config,
      fsmState: ctx.fsmState,
      paddleCurrent,
      threat,
      ownGoalLineX: snap.ownGoal.lineX,
      engageCtx: ctx,
    })
    target = plan.target
    action = plan.action
    interceptPoint = plan.interceptPoint
  }

  if (ctx.fsmState === 'recover') {
    const guard = attackTarget(puck, config, playerId)
    target = {
      x: guard.x * 0.3 + target.x * 0.7,
      z: target.z,
    }
    action = 'recover'
  }

  const offensive =
    action === 'offensiveStrike' ||
    action === 'centerStrike' ||
    action === 'clear' ||
    action === 'bankShot'
  const threatUrgency =
    ctx.fsmState === 'intercept'
      ? 1
      : threat.tier === 'HIGH' || threat.tier === 'CRITICAL'
        ? 0.92
        : offensive
          ? 0.88
          : ctx.fsmState === 'clear'
            ? 0.85
            : action === 'remoteDefense'
              ? 0.65
              : 0.5

  return {
    target,
    urgency: threatUrgency,
    useBank,
    burst: isBurstActive(ctx, now) && !risky,
    action,
    interceptPoint,
  }
}
