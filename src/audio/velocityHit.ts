import { MAX_PUCK_SPEED } from '../constants/physics'
import type { SfxId } from './types'

type HitFamily = 'hit-paddle' | 'hit-wall'

const HIT_SPEED_MID = MAX_PUCK_SPEED * 0.4

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

export function pickVelocityHitSfx(
  family: HitFamily,
  speed: number,
): { id: SfxId; rate: number } {
  if (speed >= HIT_SPEED_MID) {
    const t = clamp01((speed - HIT_SPEED_MID) / (MAX_PUCK_SPEED - HIT_SPEED_MID))
    return { id: `${family}-high`, rate: 1.04 + t * 0.18 }
  }
  const t = clamp01(speed / HIT_SPEED_MID)
  return { id: `${family}-low`, rate: 0.9 + t * 0.1 }
}
