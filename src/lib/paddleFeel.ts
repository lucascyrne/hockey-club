import {
  MAX_PADDLE_SPEED,
  PADDLE_INPUT_SPEED,
} from '../constants/paddle'
import type { PlayerId } from '../systems/bounds'
import { useSettingsStore } from '../stores/settingsStore'

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function getPaddleSpeedLevel(playerId: PlayerId): number {
  const s = useSettingsStore.getState()
  return playerId === 1 ? s.paddleSpeedP1 : s.paddleSpeedP2
}

export function getPaddleInputSpeed(level: number) {
  return PADDLE_INPUT_SPEED * lerp(0.5, 1, clamp01(level))
}

export function getPaddleMaxSpeed(level: number) {
  return MAX_PADDLE_SPEED * lerp(0.5, 1, clamp01(level))
}
