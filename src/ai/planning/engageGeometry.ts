import { CPU_DEFENSE_X } from '../../constants/cpu'
import {
  PADDLE_P1_X_MAX,
  PADDLE_P2_X_MIN,
} from '../../constants/paddle'
import {
  cornerSignsFromPosition,
  isPuckInCornerWedge,
  projectToCornerDiagonal,
} from '../../constants/tableCorners'
import type { PuckSample } from '../../lib/puckTracker'
import type { PlayerId } from '../../systems/bounds'
import { clampPaddlePosition } from '../../systems/bounds'
import { GOAL_LINE_X_NEG, GOAL_LINE_X_POS } from '../../systems/rules'
import type { CpuFsmContext } from '../fsm/types'
import type { Vec2 } from '../types'

const P1_DEFENSE_X = -CPU_DEFENSE_X
const ENGAGE_PAD_X = 0.07
const ENGAGE_LOCK_MS = 130
const PUCK_MOVE_BREAK = 0.04
const NEAR_ENGAGE_DIST = 0.22
const FAST_PUCK_RELEASE = 1.2

/** Disco mais perto do nosso gol que a raquete (P2: puck.x menor). */
export function isPuckBehindPaddle(
  puck: PuckSample,
  paddle: Vec2,
  playerId: PlayerId,
): boolean {
  return playerId === 2
    ? puck.x < paddle.x - 0.02
    : puck.x > paddle.x + 0.02
}

/** Raquete passou o disco em direção ao campo adversário. */
export function isPaddleOvershotPastPuck(
  puck: PuckSample,
  paddle: Vec2,
  playerId: PlayerId,
): boolean {
  return playerId === 2
    ? paddle.x > puck.x + 0.03
    : paddle.x < puck.x - 0.03
}

export { isPuckInCornerWedge }

/** Alvo para empurrar o disco para o centro quando preso no canto. */
export function cornerEscapeTarget(
  puck: PuckSample,
  playerId: PlayerId,
): Vec2 | null {
  if (!isPuckInCornerWedge(puck.x, puck.z)) return null

  const signs = cornerSignsFromPosition(puck.x, puck.z)
  if (!signs) return null

  const { nx, nz } = projectToCornerDiagonal(
    puck.x,
    puck.z,
    signs.signX,
    signs.signZ,
  )
  const push = 0.14
  const tx = puck.x + nx * push
  const tz = puck.z + nz * push

  return clampPaddlePosition(tx, tz, playerId)
}

function computeEngagePoint(puck: PuckSample, playerId: PlayerId): Vec2 {
  const tx =
    playerId === 2 ? puck.x - ENGAGE_PAD_X : puck.x + ENGAGE_PAD_X
  return { x: tx, z: puck.z }
}

/** Mantém alvo fixo por ~130 ms perto do disco (reduz jitter). */
export function resolveStableEngageTarget(
  puck: PuckSample,
  paddle: Vec2,
  playerId: PlayerId,
  raw: Vec2,
  now: number,
  ctx: CpuFsmContext,
  demoMode = false,
): Vec2 {
  const speed = Math.hypot(puck.vx, puck.vz)
  if (speed > FAST_PUCK_RELEASE) {
    ctx.engageLock = null
    ctx.engageLockPuckRef = null
    return mergeEngageTarget(puck, raw, playerId, paddle)
  }

  if (isPuckBehindPaddle(puck, paddle, playerId)) {
    ctx.engageLock = null
    ctx.engageLockPuckRef = null
    const engageX = playerId === 2 ? puck.x - 0.08 : puck.x + 0.08
    return clampPaddlePosition(engageX, puck.z, playerId)
  }

  const corner = cornerEscapeTarget(puck, playerId)
  const base = corner ?? raw
  const dist = Math.hypot(paddle.x - puck.x, paddle.z - puck.z)

  if (dist >= NEAR_ENGAGE_DIST || demoMode) {
    ctx.engageLock = null
    ctx.engageLockPuckRef = null
    return mergeEngageTarget(puck, base, playerId, paddle)
  }

  const ref = ctx.engageLockPuckRef
  const puckMoved =
    ref !== null &&
    Math.hypot(puck.x - ref.x, puck.z - ref.z) > PUCK_MOVE_BREAK

  if (puckMoved || !ctx.engageLock || now > ctx.engageLockUntil) {
    const pt = computeEngagePoint(puck, playerId)
    ctx.engageLock = { x: pt.x, z: pt.z }
    ctx.engageLockPuckRef = { x: puck.x, z: puck.z }
    ctx.engageLockUntil = now + ENGAGE_LOCK_MS
  }

  return clampPaddlePosition(ctx.engageLock.x, ctx.engageLock.z, playerId)
}

export function updateSweepHysteresis(
  dist: number,
  ctx: CpuFsmContext,
  wantSweep: boolean,
): boolean {
  if (wantSweep && dist < 0.4) ctx.sweepActive = true
  if (ctx.sweepActive && dist > 0.48) ctx.sweepActive = false
  return ctx.sweepActive
}

/**
 * Ajusta X do alvo quando o disco está fundo no nosso campo ou atrás da raquete,
 * sem abandonar bloqueio na boca do gol quando o disco está à frente.
 */
export function mergeEngageTargetX(
  puck: PuckSample,
  preferredX: number,
  playerId: PlayerId,
  paddle?: Vec2,
): number {
  if (playerId === 2) {
    const goalSide = puck.x < CPU_DEFENSE_X - 0.04
    const behind =
      paddle !== undefined && isPuckBehindPaddle(puck, paddle, playerId)
    if (!goalSide && !behind) {
      return Math.min(CPU_DEFENSE_X + 0.1, preferredX)
    }
    const chaseX = Math.max(
      PADDLE_P2_X_MIN,
      GOAL_LINE_X_NEG + 0.1,
      puck.x - ENGAGE_PAD_X,
    )
    return Math.min(preferredX, chaseX)
  }

  const goalSide = puck.x > P1_DEFENSE_X + 0.04
  const behind =
    paddle !== undefined && isPuckBehindPaddle(puck, paddle, playerId)
  if (!goalSide && !behind) {
    return Math.max(P1_DEFENSE_X - 0.1, preferredX)
  }
  const chaseX = Math.min(
    PADDLE_P1_X_MAX,
    GOAL_LINE_X_POS - 0.1,
    puck.x + ENGAGE_PAD_X,
  )
  return Math.max(preferredX, chaseX)
}

export function mergeEngageTarget(
  puck: PuckSample,
  preferred: Vec2,
  playerId: PlayerId,
  paddle?: Vec2,
): Vec2 {
  const corner = cornerEscapeTarget(puck, playerId)
  const base = corner ?? preferred
  const tx = mergeEngageTargetX(puck, base.x, playerId, paddle)
  return clampPaddlePosition(tx, base.z, playerId)
}

export function isNearEngage(
  puck: PuckSample,
  paddle: Vec2,
): boolean {
  return Math.hypot(paddle.x - puck.x, paddle.z - puck.z) < NEAR_ENGAGE_DIST
}
