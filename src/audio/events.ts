import { isMenuDemoActive } from '../stores/menuDemoStore'
import { playSfx } from './audioEngine'
import type { SfxId } from './types'

function canPlayGameAudio() {
  return !isMenuDemoActive()
}

export function playHitPaddleSfx(impact = 1) {
  if (!canPlayGameAudio()) return
  const volume = Math.min(1, 0.35 + impact * 0.12)
  const rate = 0.95 + Math.random() * 0.1
  playSfx('hit-paddle', { volume, rate })
}

export function playGoalSfx() {
  if (!canPlayGameAudio()) return
  playSfx('goal')
}

export function playWinSfx() {
  if (!canPlayGameAudio()) return
  playSfx('win')
}

export function playFaceoffSfx() {
  if (!canPlayGameAudio()) return
  playSfx('faceoff')
}

const TICK_RATE: Record<1 | 2 | 3, number> = { 1: 0.82, 2: 1, 3: 1.18 }

export function playCountdownTickSfx(step: 1 | 2 | 3) {
  if (!canPlayGameAudio()) return
  playSfx('countdown-tick', { rate: TICK_RATE[step], volume: 0.95 })
}

export function playCountdownPuckSfx() {
  if (!canPlayGameAudio()) return
  playSfx('countdown-puck', { volume: 1, rate: 1.05 })
}

export function playSfxIfAllowed(id: SfxId, options?: Parameters<typeof playSfx>[1]) {
  if (!canPlayGameAudio()) return
  playSfx(id, options)
}
