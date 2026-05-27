/** Contrato partilhado cliente ↔ servidor (JSON). */

export type WinTarget = 3 | 5 | 7
export type NetPlayerId = 1 | 2
export type NetGamePhase = 'countdown' | 'playing' | 'goal' | 'gameOver'

export type Vec2 = { x: number; z: number }

export type PuckSnapshot = {
  x: number
  z: number
  vx: number
  vz: number
}

export type StatePayload = {
  seq: number
  puck: PuckSnapshot
  p1: Vec2
  p2: Vec2
  phase: NetGamePhase
  scores: [number, number]
  countdownStep: 1 | 2 | 3 | 'puck' | null
  flow: 'play' | 'held' | 'inChute' | 'ejecting'
}

export type C2S =
  | { t: 'create' }
  | { t: 'join'; code: string }
  | { t: 'ready' }
  | { t: 'start'; winTarget: WinTarget }
  | { t: 'input'; seq: number; px: number; pz: number }
  | { t: 'state'; state: StatePayload }
  | { t: 'goal'; scorer: NetPlayerId }
  | { t: 'leave' }
  | { t: 'ping'; ts: number }

export type S2C =
  | { t: 'room'; code: string; role: NetPlayerId }
  | { t: 'peer'; status: 'joined' | 'left' }
  | { t: 'match'; winTarget: WinTarget }
  | { t: 'state'; state: StatePayload }
  | { t: 'remoteInput'; seq: number; px: number; pz: number }
  | { t: 'goal'; scorer: NetPlayerId }
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
export const TICK_MS = 33
export const MAX_MSG_BYTES = 4096

export function parseC2S(raw: string): C2S | null {
  try {
    const msg = JSON.parse(raw) as C2S
    if (!msg || typeof msg !== 'object' || !('t' in msg)) return null
    return msg
  } catch {
    return null
  }
}

export function parseS2C(raw: string): S2C | null {
  try {
    const msg = JSON.parse(raw) as S2C
    if (!msg || typeof msg !== 'object' || !('t' in msg)) return null
    return msg
  } catch {
    return null
  }
}
