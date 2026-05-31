/** Formal CPU states — Sense → Think → Plan → Act. */
export type CpuFsmState =
  | 'wait'
  | 'guard'
  | 'track'
  | 'intercept'
  | 'clear'
  | 'attack'
  | 'pressure'
  | 'recover'

/** Legacy 3-mode mapping for HUD/debug. */
export type CpuLegacyMode = 'attack' | 'defend' | 'press'

export function fsmToLegacyMode(state: CpuFsmState): CpuLegacyMode {
  switch (state) {
    case 'clear':
      return 'press'
    case 'attack':
    case 'pressure':
      return 'attack'
    default:
      return 'defend'
  }
}

export type CpuFsmContext = {
  fsmState: CpuFsmState
  holdUntil: number
  modeLockedUntil: number
  puckOnCpuHalfSince: number
  forceClearAt: number
  fakeAttackUntil: number
  burstUntil: number
  lastBurstAt: number
  /** Alvo estável perto do disco (evita jitter). */
  engageLock: { x: number; z: number } | null
  engageLockUntil: number
  engageLockPuckRef: { x: number; z: number } | null
  sweepActive: boolean
}

export function createCpuFsmContext(): CpuFsmContext {
  return {
    fsmState: 'guard',
    holdUntil: 0,
    modeLockedUntil: 0,
    puckOnCpuHalfSince: 0,
    forceClearAt: 0,
    fakeAttackUntil: 0,
    burstUntil: 0,
    lastBurstAt: 0,
    engageLock: null,
    engageLockUntil: 0,
    engageLockPuckRef: null,
    sweepActive: false,
  }
}
