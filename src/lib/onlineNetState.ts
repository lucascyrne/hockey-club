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

let lastState: StatePayload | null = null

export function applyGuestState(state: StatePayload) {
  if (state.seq <= onlineGuestPuck.lastSeq) return
  onlineGuestPuck.lastSeq = state.seq
  onlineGuestPuck.target = { ...state.puck }
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
  lastState = null
}

/** Limiar de desvio para snap imediato (evita "teletransporte" lento). */
const SNAP_THRESHOLD = 0.2

/**
 * Interpola disco do convidado em direção ao snapshot.
 * - Snap imediato se o desvio for muito grande (reduz atraso perceptível).
 * - Alpha adaptativo: mais agressivo quando longe, mais suave ao aproximar.
 */
export function stepGuestPuckInterpolation(delta: number) {
  const c = onlineGuestPuck.current
  const t = onlineGuestPuck.target

  const dx = t.x - c.x
  const dz = t.z - c.z
  const dist = Math.hypot(dx, dz)

  if (dist > SNAP_THRESHOLD) {
    // Snap direto para eliminar lag acumulado
    c.x = t.x
    c.z = t.z
    c.vx = t.vx
    c.vz = t.vz
    return
  }

  // Alpha baseado em delta real (60 Hz → ~0.36, 30 Hz → ~0.55)
  const alpha = 1 - Math.pow(0.015, delta)
  c.x += dx * alpha
  c.z += dz * alpha
  c.vx += (t.vx - c.vx) * alpha
  c.vz += (t.vz - c.vz) * alpha
}
