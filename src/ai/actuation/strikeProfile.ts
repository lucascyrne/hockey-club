/** Perfil de remate CPU — lido no contacto disco×raquete (sem Zustand). */
let strikeStrength = 1
let isStrike = false

export function setCpuStrikeProfile(strength: number, strike: boolean) {
  strikeStrength = Math.max(0.2, Math.min(1.5, strength))
  isStrike = strike
}

export function getCpuStrikeStrength(baseHit: number): number {
  if (!isStrike) return baseHit
  return Math.min(1.35, baseHit * strikeStrength)
}

export function resetCpuStrikeProfile() {
  strikeStrength = 1
  isStrike = false
}
