import type { SfxId } from './types'

/**
 * Ganhos de reprodução por SFX (1 = neutro). Valores > 1 são suportados (Web Audio).
 * Volume audível ≈ masterVolume × sfxVolume (settings) × volume aqui.
 */
export const SFX_PLAYBACK: Record<SfxId, { volume: number; rate: number }> = {
  goal: { volume: 0.5, rate: 1 },
  win: { volume: 1, rate: 1 },
  faceoff: { volume: 0.5, rate: 1 },
  'countdown-tick': { volume: 1.5, rate: 1 },
  'countdown-puck': { volume: 1, rate: 1 },
  'hit-paddle-low': { volume: 1, rate: 1 },
  'hit-paddle-high': { volume: 1, rate: 1 },
  'hit-wall-low': { volume: 1, rate: 1 },
  'hit-wall-high': { volume: 1, rate: 1 },
}

/** Curvas dinâmicas de volume nos impactos (além de SFX_PLAYBACK[id]). */
export const HIT_SFX_LEVEL = {
  paddle: { floor: 0.4, speedBoost: 0.5, speedAtMax: 8 },
  wall: { floor: 0.35, speedBoost: 0.45, speedAtMax: 9 },
} as const
