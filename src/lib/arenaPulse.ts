/** Intensidade emissiva com pulso de impacto e flash de gol. */
export function arenaEmissive(
  base: number,
  pulse: number,
  goal: number,
  pulseGain = 0.35,
  goalGain = 0.45,
): number {
  return base + pulse * pulseGain + goal * goalGain
}
