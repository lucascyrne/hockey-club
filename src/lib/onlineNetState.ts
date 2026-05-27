import type { PuckSnapshot, StatePayload } from '../../shared/protocol'

/** Estado de rede em refs (sem re-render). */

export const onlineGuestPuck = {
  current: { x: 0, z: 0, vx: 0, vz: 0 } as PuckSnapshot,
  target: { x: 0, z: 0, vx: 0, vz: 0 } as PuckSnapshot,
  lastSeq: 0,
}

export const onlineRemoteInput = {
  px: 0,
  pz: 0,
  seq: 0,
}

type TimedPuckSnapshot = PuckSnapshot & { at: number }

/** Histórico de snapshots para interpolação temporal (guest). */
const puckHistory: TimedPuckSnapshot[] = []
const MAX_HISTORY = 12

/**
 * Atraso de renderização em relação ao snapshot mais recente.
 * Compensa RTT + jitter; disco segue trajetória suave entre estados do host.
 */
const INTERP_DELAY_MS = 80

/** Só faz snap se a conexão parar e o erro for grande (stall). */
const STALL_SNAP_MS = 250
const STALL_SNAP_DIST = 0.55

let lastState: StatePayload | null = null

export function applyGuestState(state: StatePayload) {
  if (state.seq <= onlineGuestPuck.lastSeq) return
  onlineGuestPuck.lastSeq = state.seq
  onlineGuestPuck.target = { ...state.puck }
  const at = performance.now()
  puckHistory.push({ ...state.puck, at })
  if (puckHistory.length > MAX_HISTORY) puckHistory.shift()
  lastState = state
}

export function getLastGuestState() {
  return lastState
}

export function resetOnlineNetState() {
  onlineGuestPuck.lastSeq = 0
  onlineGuestPuck.current = { x: 0, z: 0, vx: 0, vz: 0 }
  onlineGuestPuck.target = { x: 0, z: 0, vx: 0, vz: 0 }
  onlineRemoteInput.seq = 0
  onlineRemoteInput.px = 0
  onlineRemoteInput.pz = 0
  puckHistory.length = 0
  lastState = null
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function lerpSnapshot(a: PuckSnapshot, b: PuckSnapshot, u: number): PuckSnapshot {
  return {
    x: a.x + (b.x - a.x) * u,
    z: a.z + (b.z - a.z) * u,
    vx: a.vx + (b.vx - a.vx) * u,
    vz: a.vz + (b.vz - a.vz) * u,
  }
}

function samplePuckAtTime(renderTime: number): PuckSnapshot | null {
  if (puckHistory.length === 0) return null
  if (puckHistory.length === 1) return puckHistory[0]

  let i = 0
  while (i < puckHistory.length - 1 && puckHistory[i + 1].at <= renderTime) {
    i += 1
  }

  if (i >= puckHistory.length - 1) {
    const last = puckHistory[puckHistory.length - 1]
    const prev = puckHistory[puckHistory.length - 2]
    const span = last.at - prev.at
    if (span < 1) return last
    const extra = clamp01((renderTime - last.at) / span)
    const cap = 0.2
    return {
      x: last.x + (last.x - prev.x) * extra * cap,
      z: last.z + (last.z - prev.z) * extra * cap,
      vx: last.vx,
      vz: last.vz,
    }
  }

  const a = puckHistory[i]
  const b = puckHistory[i + 1]
  const span = b.at - a.at
  const u = span > 1 ? clamp01((renderTime - a.at) / span) : 0
  const pos = lerpSnapshot(a, b, u)
  if (span > 1) {
    const inv = 1000 / span
    pos.vx = (b.x - a.x) * inv
    pos.vz = (b.z - a.z) * inv
  }
  return pos
}

/** Fallback quando ainda não há histórico suficiente. */
function stepGuestPuckFallback(delta: number) {
  const c = onlineGuestPuck.current
  const t = onlineGuestPuck.target
  const alpha = 1 - Math.pow(0.008, delta)
  c.x += (t.x - c.x) * alpha
  c.z += (t.z - c.z) * alpha
  c.vx += (t.vx - c.vx) * alpha
  c.vz += (t.vz - c.vz) * alpha
}

/**
 * Interpola o disco do convidado entre snapshots do host (entity interpolation).
 * Evita snap a cada tick quando o disco se move rápido.
 */
export function stepGuestPuckInterpolation(_delta: number) {
  const c = onlineGuestPuck.current
  const now = performance.now()

  if (puckHistory.length < 2) {
    stepGuestPuckFallback(_delta)
    return
  }

  const renderTime = now - INTERP_DELAY_MS
  const sampled = samplePuckAtTime(renderTime)
  if (!sampled) return

  c.x = sampled.x
  c.z = sampled.z
  c.vx = sampled.vx
  c.vz = sampled.vz

  const newest = puckHistory[puckHistory.length - 1]
  const stallMs = now - newest.at
  const err = Math.hypot(newest.x - c.x, newest.z - c.z)
  if (stallMs > STALL_SNAP_MS && err > STALL_SNAP_DIST) {
    c.x = newest.x
    c.z = newest.z
    c.vx = newest.vx
    c.vz = newest.vz
  }
}
