import { WIN_TARGET } from '../constants/game'
import {
  CPU_ERROR_HALF,
  CPU_ERROR_REFRESH_MS,
  CPU_LEAD_TIME,
  CPU_REACTION_MS,
  CPU_SPEED_FACTOR,
} from '../constants/cpu'

export type CpuDifficulty = 1 | 2 | 3
export type WinTarget = 3 | 5 | 7

export type CpuProfile = {
  reactionMs: number
  speedFactor: number
  leadTime: number
  errorHalf: number
  errorRefreshMs: number
  hitStrength: number
  defenseWeight: number
  attackAggression: number
  clearWindowMs: { min: number; max: number }
  wallBias: number
  dwellOnHalfMs: { min: number; max: number } | null
}

const PROFILE_3: CpuProfile = {
  reactionMs: CPU_REACTION_MS,
  speedFactor: CPU_SPEED_FACTOR,
  leadTime: CPU_LEAD_TIME,
  errorHalf: CPU_ERROR_HALF,
  errorRefreshMs: CPU_ERROR_REFRESH_MS,
  hitStrength: 1,
  defenseWeight: 0.62,
  attackAggression: 0.56,
  clearWindowMs: { min: 800, max: 1500 },
  wallBias: 0.72,
  dwellOnHalfMs: null,
}

const PROFILE_2: CpuProfile = {
  reactionMs: 200,
  speedFactor: 0.6,     // ligeiramente mais rápido
  leadTime: 0.09,
  errorHalf: 0.04,
  errorRefreshMs: 650,
  hitStrength: 0.82,
  defenseWeight: 0.72,
  attackAggression: 0.42,
  clearWindowMs: { min: 1100, max: 2100 },
  wallBias: 0.6,
  dwellOnHalfMs: { min: 450, max: 900 },
}

const PROFILE_1: CpuProfile = {
  reactionMs: 380,
  speedFactor: 0.44,
  leadTime: 0.05,
  errorHalf: 0.055,
  errorRefreshMs: 850,
  hitStrength: 0.68,
  defenseWeight: 0.84,
  attackAggression: 0.2,
  clearWindowMs: { min: 1600, max: 2600 },
  wallBias: 0.45,
  dwellOnHalfMs: { min: 500, max: 1200 },
}

const PROFILES: Record<CpuDifficulty, CpuProfile> = {
  1: PROFILE_1,
  2: PROFILE_2,
  3: PROFILE_3,
}

export function getCpuProfile(level: CpuDifficulty): CpuProfile {
  return PROFILES[level]
}

export function normalizeWinTarget(v: number): WinTarget {
  if (v <= 3) return 3
  if (v <= 5) return 5
  return 7
}

export function normalizeCpuDifficulty(v: number): CpuDifficulty {
  if (v <= 1) return 1
  if (v <= 2) return 2
  return 3
}

export const DEFAULT_WIN_TARGET: WinTarget = WIN_TARGET
