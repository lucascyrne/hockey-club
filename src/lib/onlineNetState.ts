import type { PuckSnapshot, SnapshotPayload, Vec2 } from '../../shared/protocol'
import { PHYSICS_TIMESTEP } from '../../shared/protocol'
import { PADDLE_SPAWN } from '../../shared/sim/paddleConstants'

export const TICK_MS = PHYSICS_TIMESTEP * 1000
const MAX_HISTORY = 32
const MAX_EXTRAP_TICKS = 2
const MAX_DELAY_TICKS = 4

export const netPuck = {
  current: { x: 0, z: 0, vx: 0, vz: 0 } as PuckSnapshot,
}

export const netPaddle = {
  p1: { x: 0, z: 0 } as Vec2,
  p2: { x: 0, z: 0 } as Vec2,
}

type TimedPuck = PuckSnapshot & { tick: number }
type TimedVec = Vec2 & { tick: number }

const puckHistory: TimedPuck[] = []
const p1History: TimedVec[] = []
const p2History: TimedVec[] = []

let latestTick = 0
let interpDelayMs = TICK_MS
let lastSnapshot: SnapshotPayload | null = null
let lastSnapshotArrival = 0

function seedSpawn() {
  netPaddle.p1.x = PADDLE_SPAWN.p1.x
  netPaddle.p1.z = PADDLE_SPAWN.p1.z
  netPaddle.p2.x = PADDLE_SPAWN.p2.x
  netPaddle.p2.z = PADDLE_SPAWN.p2.z
  netPuck.current = { x: 0, z: 0, vx: 0, vz: 0 }
}

export function setNetInterpDelayMs(ms: number) {
  interpDelayMs = Math.max(0, Math.min(120, ms))
}

function delayTicks() {
  if (interpDelayMs <= TICK_MS) return 0
  return Math.max(1, Math.min(MAX_DELAY_TICKS, Math.ceil(interpDelayMs / TICK_MS)))
}

/** Transições que invalidam interpolação entre histórico antigo e novo estado. */
export function isSnapshotDiscontinuity(
  prev: SnapshotPayload,
  next: SnapshotPayload,
): boolean {
  if (prev.flow === 'held' && next.flow === 'play') return true
  if (prev.flow === 'play' && next.flow === 'held') return true
  if (prev.phase === 'countdown' && next.phase === 'playing') return true
  if (prev.countdownStep !== 'puck' && next.countdownStep === 'puck') return true
  return false
}

function writeNetFromSnapshot(snapshot: SnapshotPayload) {
  netPuck.current = { ...snapshot.puck }
  netPaddle.p1 = { ...snapshot.p1 }
  netPaddle.p2 = { ...snapshot.p2 }
}

/** Repõe histórico com um único tick — evita misturar held antigo com faceoff. */
export function snapToLatest(snapshot: SnapshotPayload) {
  puckHistory.length = 0
  p1History.length = 0
  p2History.length = 0

  puckHistory.push({ ...snapshot.puck, tick: snapshot.tick })
  p1History.push({ ...snapshot.p1, tick: snapshot.tick })
  p2History.push({ ...snapshot.p2, tick: snapshot.tick })

  latestTick = snapshot.tick
  lastSnapshotArrival = performance.now()
  writeNetFromSnapshot(snapshot)
}

function pushHistory(snapshot: SnapshotPayload) {
  puckHistory.push({ ...snapshot.puck, tick: snapshot.tick })
  p1History.push({ ...snapshot.p1, tick: snapshot.tick })
  p2History.push({ ...snapshot.p2, tick: snapshot.tick })

  while (puckHistory.length > MAX_HISTORY) puckHistory.shift()
  while (p1History.length > MAX_HISTORY) p1History.shift()
  while (p2History.length > MAX_HISTORY) p2History.shift()

  latestTick = Math.max(latestTick, snapshot.tick)
  lastSnapshotArrival = performance.now()
}

export function applySnapshot(snapshot: SnapshotPayload) {
  const prev = lastSnapshot
  pushHistory(snapshot)

  if (!prev || isSnapshotDiscontinuity(prev, snapshot)) {
    snapToLatest(snapshot)
  }

  lastSnapshot = snapshot
}

export function resetOnlineNetState() {
  puckHistory.length = 0
  p1History.length = 0
  p2History.length = 0
  latestTick = 0
  lastSnapshot = null
  lastSnapshotArrival = 0
  interpDelayMs = TICK_MS
  seedSpawn()
}

function sampleByTick<T extends { tick: number }>(
  history: T[],
  renderTick: number,
  blend: (a: T, b: T, u: number) => T,
  extrapolate?: (last: T, tickDelta: number) => T,
): T | null {
  if (history.length === 0) return null
  if (history.length === 1) return history[0]

  let i = 0
  while (i < history.length - 1 && history[i + 1].tick <= renderTick) i++

  if (i >= history.length - 1) {
    const last = history[history.length - 1]
    const tickDelta = renderTick - last.tick
    if (tickDelta > 0 && extrapolate) {
      return extrapolate(last, Math.min(tickDelta, MAX_EXTRAP_TICKS))
    }
    return last
  }

  const a = history[i]
  const b = history[i + 1]
  const span = b.tick - a.tick
  const u = span > 0 ? Math.max(0, Math.min(1, (renderTick - a.tick) / span)) : 0
  return blend(a, b, u)
}

/** Interpolação sub-frame entre os dois últimos snapshots (LAN, delay 0). */
function sampleLatestPair<T extends { tick: number }>(
  history: T[],
  blend: (a: T, b: T, u: number) => T,
): T | null {
  if (history.length === 0) return null
  if (history.length === 1) return history[0]

  const a = history[history.length - 2]
  const b = history[history.length - 1]
  const elapsed = performance.now() - lastSnapshotArrival
  const u = Math.max(0, Math.min(1, elapsed / TICK_MS))
  return blend(a, b, u)
}

function blendPuck(a: TimedPuck, b: TimedPuck, u: number): TimedPuck {
  return {
    tick: b.tick,
    x: a.x + (b.x - a.x) * u,
    z: a.z + (b.z - a.z) * u,
    vx: a.vx + (b.vx - a.vx) * u,
    vz: a.vz + (b.vz - a.vz) * u,
  }
}

function extrapPuck(last: TimedPuck, tickDelta: number): TimedPuck {
  const dt = tickDelta * PHYSICS_TIMESTEP
  return {
    ...last,
    tick: last.tick + tickDelta,
    x: last.x + last.vx * dt,
    z: last.z + last.vz * dt,
    vx: last.vx,
    vz: last.vz,
  }
}

function blendVec(a: TimedVec, b: TimedVec, u: number): TimedVec {
  return {
    tick: b.tick,
    x: a.x + (b.x - a.x) * u,
    z: a.z + (b.z - a.z) * u,
  }
}

function applyPuck(puck: TimedPuck) {
  netPuck.current.x = puck.x
  netPuck.current.z = puck.z
  netPuck.current.vx = puck.vx
  netPuck.current.vz = puck.vz
}

function applyPaddles(p1: TimedVec | null, p2: TimedVec | null) {
  if (p1) {
    netPaddle.p1.x = p1.x
    netPaddle.p1.z = p1.z
  }
  if (p2) {
    netPaddle.p2.x = p2.x
    netPaddle.p2.z = p2.z
  }
}

export function stepOnlineInterpolation() {
  if (latestTick === 0) return

  const delay = delayTicks()

  if (delay === 0) {
    const puck = sampleLatestPair(puckHistory, blendPuck)
    if (puck) applyPuck(puck)
    applyPaddles(
      sampleLatestPair(p1History, blendVec),
      sampleLatestPair(p2History, blendVec),
    )
    return
  }

  const firstTick = puckHistory[0]?.tick ?? 1
  const renderTick = Math.max(firstTick, latestTick - delay)

  const puck = sampleByTick(puckHistory, renderTick, blendPuck, extrapPuck)
  if (puck) applyPuck(puck)

  applyPaddles(
    sampleByTick(p1History, renderTick, blendVec),
    sampleByTick(p2History, renderTick, blendVec),
  )
}
