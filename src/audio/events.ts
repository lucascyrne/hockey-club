import { isMenuDemoActive } from '../stores/menuDemoStore'
import { playSfx, replaySfx, stopSfx } from './audioEngine'
import { HIT_SFX_LEVEL, SFX_PLAYBACK } from './sfxLevels'
import type { SfxId } from './types'
import { pickVelocityHitSfx } from './velocityHit'

function canPlayGameAudio() {
  return !isMenuDemoActive()
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function playSfxConfigured(
  id: SfxId,
  extra?: { volume?: number; rate?: number },
  play = playSfx,
) {
  const base = SFX_PLAYBACK[id]
  play(id, {
    volume: (extra?.volume ?? 1) * base.volume,
    rate: (extra?.rate ?? 1) * base.rate,
  })
}

type HitSfxCurve = (typeof HIT_SFX_LEVEL)[keyof typeof HIT_SFX_LEVEL]

function hitVolume(curve: HitSfxCurve, speed: number, id: SfxId) {
  const gain = curve.floor + clamp01(speed / curve.speedAtMax) * curve.speedBoost
  return gain * SFX_PLAYBACK[id].volume
}

export function playHitPaddleSfx(speed: number) {
  if (!canPlayGameAudio()) return
  const { id, rate } = pickVelocityHitSfx('hit-paddle', speed)
  const volume = hitVolume(HIT_SFX_LEVEL.paddle, speed, id)
  playSfx(id, { volume, rate: rate * SFX_PLAYBACK[id].rate })
}

export function playHitWallSfx(speed: number) {
  if (!canPlayGameAudio()) return
  const { id, rate } = pickVelocityHitSfx('hit-wall', speed)
  const volume = hitVolume(HIT_SFX_LEVEL.wall, speed, id)
  playSfx(id, { volume, rate: rate * SFX_PLAYBACK[id].rate })
}

export function playGoalSfx() {
  if (!canPlayGameAudio()) return
  playSfxConfigured('goal')
}

export function playWinSfx() {
  if (!canPlayGameAudio()) return
  playSfxConfigured('win')
}

export function playFaceoffSfx() {
  if (!canPlayGameAudio()) return
  playSfxConfigured('faceoff')
}

/** Clip único (~2 s) com 3→2→1; tocar uma vez por contagem. */
export function playCountdownTickSfx() {
  if (!canPlayGameAudio()) return
  playSfxConfigured('countdown-tick', undefined, replaySfx)
}

export function stopCountdownTickSfx() {
  stopSfx('countdown-tick')
}

export function playCountdownPuckSfx() {
  if (!canPlayGameAudio()) return
  playSfxConfigured('countdown-puck')
}

export function playSfxIfAllowed(id: SfxId, options?: Parameters<typeof playSfx>[1]) {
  if (!canPlayGameAudio()) return
  const base = SFX_PLAYBACK[id]
  playSfx(id, {
    volume: (options?.volume ?? 1) * base.volume,
    rate: (options?.rate ?? 1) * base.rate,
  })
}
