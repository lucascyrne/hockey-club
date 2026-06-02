/** Contrato partilhado cliente ↔ servidor. */

export type WinTarget = 3 | 5 | 7
export type NetPlayerId = 1 | 2
export type NetGamePhase = 'countdown' | 'playing' | 'goal' | 'gameOver'
export type NetPuckFlow = 'play' | 'held' | 'inChute' | 'ejecting'

export type Vec2 = { x: number; z: number }

export type PuckSnapshot = {
  x: number
  z: number
  vx: number
  vz: number
}

export type SnapshotPayload = {
  serverTime: number
  tick: number
  puck: PuckSnapshot
  p1: Vec2
  p2: Vec2
  phase: NetGamePhase
  scores: [number, number]
  countdownStep: 1 | 2 | 3 | 'puck' | null
  flow: NetPuckFlow
}

export type C2S =
  | { t: 'create' }
  | { t: 'join'; code: string }
  | { t: 'ready' }
  | { t: 'start'; winTarget: WinTarget }
  | { t: 'input'; tick: number; px: number; pz: number }
  | { t: 'rematch' }
  | { t: 'leave' }
  | { t: 'ping'; ts: number }

export type S2C =
  | { t: 'room'; code: string; role: NetPlayerId }
  | { t: 'peer'; status: 'joined' | 'left' }
  | { t: 'match'; winTarget: WinTarget }
  | { t: 'snapshot'; snapshot: SnapshotPayload }
  | { t: 'goal'; scorer: NetPlayerId }
  | { t: 'rematch'; ready: [boolean, boolean] }
  | { t: 'error'; code: string }
  | { t: 'pong'; ts: number }

export const ROOM_CODE_LEN = 6
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function normalizeCode(raw: string): string | null {
  const code = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (code.length !== ROOM_CODE_LEN) return null
  if ([...code].some((c) => !CODE_CHARS.includes(c))) return null
  return code
}

export const SERVER_TICK_HZ = 60
export const PHYSICS_TIMESTEP = 1 / SERVER_TICK_HZ
export const MAX_MSG_BYTES = 4096
