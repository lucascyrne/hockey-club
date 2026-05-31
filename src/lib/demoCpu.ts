import type { CpuProfile } from './cpuDifficulty'
import { getCpuProfile } from './cpuDifficulty'

const BASE = getCpuProfile(3)

/** Perfil P1 na hero demo — reação rápida, sem dwell. */
export const DEMO_CPU_PROFILE_P1: CpuProfile = {
  ...BASE,
  reactionMs: 130,
  hitStrength: 1.05,
  attackAggression: 0.65,
  errorHalf: 0,
  dwellOnHalfMs: null,
}

/** P2 ligeiramente mais agressivo para evitar espelhamento no centro. */
export const DEMO_CPU_PROFILE_P2: CpuProfile = {
  ...DEMO_CPU_PROFILE_P1,
  attackAggression: 0.7,
}

export function getDemoCpuProfile(playerId: 1 | 2): CpuProfile {
  return playerId === 2 ? DEMO_CPU_PROFILE_P2 : DEMO_CPU_PROFILE_P1
}
