import {
  CPU_ERROR_REFRESH_MS,
  CPU_LEAD_TIME,
  CPU_SPEED_FACTOR,
} from '../constants/cpu'
import type { CpuDifficulty, CpuProfile } from '../lib/cpuDifficulty'

export type TacticalStyle =
  | 'defensive'
  | 'balanced'
  | 'aggressive'
  | 'counter'
  | 'chaotic'
  | 'professional'

export type Personality =
  | 'beginner'
  | 'casual'
  | 'veteran'
  | 'champion'
  | 'insane'

/** Full CPU tuning — style (what) + personality (how well). */
export type CpuConfig = CpuProfile & {
  style: TacticalStyle
  personality: Personality
  predictionHorizonS: number
  maxBounceReflections: number
  /** Erro de posicionamento na execução (m); alimenta errorHalf no merge. */
  executionErrorM: number
  consistency: number
  slipChance: number
  bankShotChance: number
  fakeAttackChance: number
  burstDurationMs: number
  burstCooldownMs: number
}

type PersonalityTuning = {
  reactionMs: number
  predictionHorizonS: number
  maxBounceReflections: number
  executionErrorM: number
  consistency: number
  slipChance: number
}

const PERSONALITY_BASE: Record<Personality, PersonalityTuning> = {
  beginner: {
    reactionMs: 350,
    predictionHorizonS: 0.12,
    maxBounceReflections: 0,
    executionErrorM: 0.055,
    consistency: 0.55,
    slipChance: 0.12,
  },
  casual: {
    reactionMs: 250,
    predictionHorizonS: 0.18,
    maxBounceReflections: 1,
    executionErrorM: 0.045,
    consistency: 0.7,
    slipChance: 0.08,
  },
  veteran: {
    reactionMs: 150,
    predictionHorizonS: 0.28,
    maxBounceReflections: 1,
    executionErrorM: 0.035,
    consistency: 0.82,
    slipChance: 0.05,
  },
  champion: {
    reactionMs: 80,
    predictionHorizonS: 0.38,
    maxBounceReflections: 2,
    executionErrorM: 0.028,
    consistency: 0.92,
    slipChance: 0.03,
  },
  insane: {
    reactionMs: 80,
    predictionHorizonS: 0.5,
    maxBounceReflections: 3,
    executionErrorM: 0.02,
    consistency: 0.97,
    slipChance: 0.02,
  },
}

const STYLE_MODS: Record<
  TacticalStyle,
  Pick<CpuConfig, 'attackAggression' | 'defenseWeight' | 'wallBias' | 'bankShotChance' | 'fakeAttackChance'>
> = {
  defensive: {
    attackAggression: 0.22,
    defenseWeight: 0.88,
    wallBias: 0.4,
    bankShotChance: 0.05,
    fakeAttackChance: 0,
  },
  balanced: {
    attackAggression: 0.42,
    defenseWeight: 0.72,
    wallBias: 0.58,
    bankShotChance: 0.15,
    fakeAttackChance: 0.08,
  },
  aggressive: {
    attackAggression: 0.58,
    defenseWeight: 0.58,
    wallBias: 0.75,
    bankShotChance: 0.28,
    fakeAttackChance: 0.12,
  },
  counter: {
    attackAggression: 0.48,
    defenseWeight: 0.78,
    wallBias: 0.55,
    bankShotChance: 0.2,
    fakeAttackChance: 0.05,
  },
  chaotic: {
    attackAggression: 0.52,
    defenseWeight: 0.65,
    wallBias: 0.65,
    bankShotChance: 0.35,
    fakeAttackChance: 0.25,
  },
  professional: {
    attackAggression: 0.5,
    defenseWeight: 0.75,
    wallBias: 0.62,
    bankShotChance: 0.22,
    fakeAttackChance: 0.1,
  },
}

const DIFFICULTY_MAP: Record<
  CpuDifficulty,
  { personality: Personality; style: TacticalStyle }
> = {
  1: { personality: 'beginner', style: 'defensive' },
  2: { personality: 'casual', style: 'balanced' },
  3: { personality: 'champion', style: 'aggressive' },
}

function profileToConfig(profile: CpuProfile, style: TacticalStyle, personality: Personality): CpuConfig {
  const p = PERSONALITY_BASE[personality]
  const s = STYLE_MODS[style]
  return {
    ...profile,
    style,
    personality,
    predictionHorizonS: Math.max(profile.leadTime, p.predictionHorizonS),
    maxBounceReflections: p.maxBounceReflections,
    executionErrorM: p.executionErrorM,
    errorHalf: Math.max(profile.errorHalf, p.executionErrorM * 0.85),
    consistency: p.consistency,
    slipChance: p.slipChance,
    bankShotChance: s.bankShotChance,
    fakeAttackChance: s.fakeAttackChance,
    burstDurationMs: style === 'aggressive' || style === 'chaotic' ? 420 : 280,
    burstCooldownMs: 2200,
    reactionMs: profile.reactionMs,
    attackAggression: profile.attackAggression * 0.55 + s.attackAggression * 0.45,
    defenseWeight: profile.defenseWeight * 0.6 + s.defenseWeight * 0.4,
    wallBias: profile.wallBias * 0.5 + s.wallBias * 0.5,
  }
}

/** Resolve full config from legacy difficulty + profile. */
export function resolveCpuConfig(
  difficulty: CpuDifficulty,
  profile: CpuProfile,
): CpuConfig {
  const { personality, style } = DIFFICULTY_MAP[difficulty]
  return profileToConfig(profile, style, personality)
}

/** Standalone configs for menu demo / tuning. */
export function createCpuConfig(
  personality: Personality,
  style: TacticalStyle,
  overrides?: Partial<CpuProfile>,
): CpuConfig {
  const base: CpuProfile = {
    reactionMs: PERSONALITY_BASE[personality].reactionMs,
    speedFactor: CPU_SPEED_FACTOR,
    leadTime: CPU_LEAD_TIME,
    errorHalf: PERSONALITY_BASE[personality].executionErrorM,
    errorRefreshMs: CPU_ERROR_REFRESH_MS,
    hitStrength: 1,
    defenseWeight: STYLE_MODS[style].defenseWeight,
    attackAggression: STYLE_MODS[style].attackAggression,
    clearWindowMs: { min: 800, max: 1500 },
    wallBias: STYLE_MODS[style].wallBias,
    dwellOnHalfMs: personality === 'beginner' || personality === 'casual'
      ? { min: 450, max: 900 }
      : null,
    ...overrides,
  }
  return profileToConfig(base, style, personality)
}
