import { Howl, Howler } from 'howler'
import { BGM_CATALOG, SFX_CATALOG } from './catalog'
import type { BgmTrack, SfxId } from './types'

export type AudioVolumes = {
  masterVolume: number
  sfxVolume: number
  bgmVolume: number
  muted: boolean
}

const BGM_FADE_MS = 300
const warned = new Set<string>()

const sfxHowls = new Map<SfxId, Howl>()
const bgmHowls = new Map<BgmTrack, Howl>()
let bgmHowl: Howl | null = null
let currentBgm: BgmTrack | null = null
let audioUnlocked = false

let volumes: AudioVolumes = {
  masterVolume: 1,
  sfxVolume: 1,
  bgmVolume: 0.7,
  muted: false,
}

function warnOnce(key: string, message: string) {
  if (warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

function effectiveSfxVolume(multiplier = 1) {
  if (volumes.muted) return 0
  return volumes.masterVolume * volumes.sfxVolume * multiplier
}

function effectiveBgmVolume() {
  if (volumes.muted) return 0
  return volumes.masterVolume * volumes.bgmVolume
}

function getSfxHowl(id: SfxId): Howl | null {
  const existing = sfxHowls.get(id)
  if (existing) return existing

  const entry = SFX_CATALOG[id]
  const howl = new Howl({
    src: entry.src,
    volume: effectiveSfxVolume(),
    preload: true,
    pool: entry.pool ?? 1,
    onloaderror: () =>
      warnOnce(`sfx:${id}`, `[audio] SFX não encontrado: ${id}`),
  })
  sfxHowls.set(id, howl)
  return howl
}

function getBgmHowl(track: BgmTrack): Howl {
  const cached = bgmHowls.get(track)
  if (cached) return cached

  const entry = BGM_CATALOG[track]
  const howl = new Howl({
    src: entry.src,
    loop: entry.loop,
    volume: 0,
    html5: true,
    preload: true,
    onloaderror: () =>
      warnOnce(`bgm:${track}`, `[audio] BGM não encontrado: ${track}`),
  })
  bgmHowls.set(track, howl)
  return howl
}

function startBgmPlayback(howl: Howl) {
  if (bgmHowl !== howl || !currentBgm) return

  const targetVol = effectiveBgmVolume()
  if (targetVol <= 0) return

  howl.volume(0)
  const soundId = howl.play()
  if (soundId === undefined) return

  howl.fade(0, targetVol, BGM_FADE_MS)
}

function ensureBgmPlaying() {
  if (!currentBgm || !bgmHowl) return
  if (bgmHowl.playing()) {
    bgmHowl.volume(effectiveBgmVolume())
    return
  }
  if (bgmHowl.state() !== 'loaded') {
    bgmHowl.once('load', () => ensureBgmPlaying())
    return
  }
  startBgmPlayback(bgmHowl)
}

/** Desbloqueia áudio após gesto do utilizador (política de autoplay). */
export function unlockAudio() {
  const ctx = Howler.ctx
  if (ctx?.state === 'suspended') {
    void ctx.resume()
  }
  audioUnlocked = true
  ensureBgmPlaying()
}

export function setAudioVolumes(next: AudioVolumes) {
  volumes = next
  for (const howl of sfxHowls.values()) {
    howl.volume(effectiveSfxVolume())
  }
  if (bgmHowl) {
    const vol = effectiveBgmVolume()
    bgmHowl.volume(vol)
    if (vol > 0) ensureBgmPlaying()
  }
}

export function playSfx(
  id: SfxId,
  options?: { volume?: number; rate?: number },
) {
  const howl = getSfxHowl(id)
  if (!howl) return

  const vol = effectiveSfxVolume(options?.volume ?? 1)
  if (vol <= 0) return

  const soundId = howl.play()
  if (soundId === undefined) return

  howl.volume(vol, soundId)
  if (options?.rate !== undefined) {
    howl.rate(options.rate, soundId)
  }
}

export function setBgm(track: BgmTrack | null) {
  if (track === currentBgm) {
    ensureBgmPlaying()
    return
  }

  const prev = bgmHowl
  currentBgm = track

  if (!track) {
    if (prev) {
      prev.fade(prev.volume(), 0, BGM_FADE_MS)
      const ref = prev
      setTimeout(() => {
        ref.stop()
        if (bgmHowl === ref) bgmHowl = null
      }, BGM_FADE_MS)
    }
    return
  }

  const next = getBgmHowl(track)
  bgmHowl = next

  next.once('load', () => startBgmPlayback(next))

  if (next.state() === 'loaded') {
    startBgmPlayback(next)
  } else if (audioUnlocked) {
    ensureBgmPlaying()
  }

  if (prev && prev !== next) {
    prev.fade(prev.volume(), 0, BGM_FADE_MS)
    setTimeout(() => prev.stop(), BGM_FADE_MS)
  }
}

export function stopBgm() {
  setBgm(null)
}
