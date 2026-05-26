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

export function playSfxIfAllowed(id: SfxId, options?: Parameters<typeof playSfx>[1]) {
  if (!canPlayGameAudio()) return
  playSfx(id, options)
}
