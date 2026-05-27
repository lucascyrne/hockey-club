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

/** Interpola disco do convidado em direção ao snapshot (chamar em useFrame). */
export function stepGuestPuckInterpolation(alpha = 0.35) {
  const c = onlineGuestPuck.current
  const t = onlineGuestPuck.target
  c.x += (t.x - c.x) * alpha
  c.z += (t.z - c.z) * alpha
  c.vx += (t.vx - c.vx) * alpha
  c.vz += (t.vz - c.vz) * alpha
}
