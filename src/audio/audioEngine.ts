import { Howl, Howler } from 'howler'
import { GOAL_SFX_MS } from '../constants/game'
import { BGM_CATALOG, SFX_CATALOG } from './catalog'
import type { BgmTrack, SfxId } from './types'

export type AudioVolumes = {
  masterVolume: number
  sfxVolume: number
  bgmVolume: number
  muted: boolean
}

const BGM_FADE_MS = 300
const BGM_DUCK_FADE_MS = 200
const BGM_DUCK_MULT = 0.32
const BGM_DUCK_SFX = new Set<SfxId>([
  'countdown-tick',
  'countdown-puck',
  'goal',
  'win',
  'faceoff',
])
const warned = new Set<string>()

const sfxHowls = new Map<SfxId, Howl>()
const bgmHowls = new Map<BgmTrack, Howl>()
let goalSfxDurationMs: number | null = null
let bgmHowl: Howl | null = null
let currentBgm: BgmTrack | null = null
let bgmDuckCount = 0

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

function sfxSettingsVolume() {
  if (volumes.muted) return 0
  return volumes.masterVolume * volumes.sfxVolume
}

/** Howler limita volume a 1.0; ganhos > 1 usam o gain node Web Audio. */
function applySfxPlaybackGain(howl: Howl, soundId: number, playbackGain: number) {
  howl.volume(Math.min(1, playbackGain), soundId)

  const boostNode = () => {
    if (playbackGain <= 1) return
    const sound = (
      howl as Howl & {
        _soundById?: (id: number) => { _node?: { gain?: { value: number } } } | null
      }
    )._soundById?.(soundId)
    const gain = sound?._node?.gain
    if (gain) gain.value = playbackGain
  }

  boostNode()
  if (playbackGain > 1) howl.once('play', boostNode, soundId)
}

function syncSfxHowlMasters() {
  const master = sfxSettingsVolume()
  for (const howl of sfxHowls.values()) {
    howl.volume(master)
  }
}

function effectiveBgmVolume() {
  if (volumes.muted) return 0
  const base = volumes.masterVolume * volumes.bgmVolume
  return bgmDuckCount > 0 ? base * BGM_DUCK_MULT : base
}

function applyBgmVolume() {
  if (!bgmHowl?.playing()) return
  const target = effectiveBgmVolume()
  const cur = bgmHowl.volume()
  if (Math.abs(cur - target) < 0.01) {
    bgmHowl.volume(target)
    return
  }
  bgmHowl.fade(cur, target, BGM_DUCK_FADE_MS)
}

function beginBgmDuck() {
  bgmDuckCount += 1
  if (bgmDuckCount === 1) applyBgmVolume()
}

function endBgmDuck() {
  if (bgmDuckCount <= 0) return
  bgmDuckCount -= 1
  if (bgmDuckCount === 0) applyBgmVolume()
}

function shouldDuckBgm(id: SfxId) {
  return BGM_DUCK_SFX.has(id)
}

function bindBgmUnduck(howl: Howl, id: SfxId, soundId: number) {
  if (!shouldDuckBgm(id)) return
  howl.once('end', () => endBgmDuck(), soundId)
}

function trackSfxDuration(id: SfxId, howl: Howl) {
  const capture = () => {
    const sec = howl.duration()
    if (sec <= 0) return
    if (id === 'goal') goalSfxDurationMs = Math.round(sec * 1000)
  }
  if (howl.state() === 'loaded') capture()
  else howl.once('load', capture)
}

function getSfxHowl(id: SfxId): Howl | null {
  const existing = sfxHowls.get(id)
  if (existing) return existing

  const entry = SFX_CATALOG[id]
  const howl = new Howl({
    src: entry.src,
    volume: sfxSettingsVolume(),
    html5: false,
    preload: true,
    pool: entry.pool ?? 1,
    onloaderror: () =>
      warnOnce(`sfx:${id}`, `[audio] SFX não encontrado: ${id}`),
  })
  trackSfxDuration(id, howl)
  sfxHowls.set(id, howl)
  return howl
}

/** Duração do SFX de gol (ms), lida do asset ou fallback. */
export function getGoalSfxDurationMs() {
  getSfxHowl('goal')
  return goalSfxDurationMs ?? GOAL_SFX_MS
}

function getBgmHowl(track: BgmTrack): Howl {
  const cached = bgmHowls.get(track)
  if (cached) return cached

  const entry = BGM_CATALOG[track]
  const howl = new Howl({
    src: entry.src,
    loop: entry.loop,
    volume: 0,
    html5: false,
    preload: true,
    onloaderror: () =>
      warnOnce(`bgm:${track}`, `[audio] BGM não encontrado: ${track}`),
  })
  bgmHowls.set(track, howl)
  return howl
}

function fadeOutAndStop(howl: Howl) {
  if (!howl.playing()) {
    howl.stop()
    howl.volume(0)
    return
  }
  const vol = howl.volume()
  howl.fade(vol, 0, BGM_FADE_MS)
  setTimeout(() => {
    howl.stop()
    howl.volume(0)
  }, BGM_FADE_MS)
}

async function resumeAudioContext() {
  const ctx = Howler.ctx
  if (ctx?.state === 'suspended') {
    try {
      await ctx.resume()
    } catch {
      /* autoplay bloqueado pelo browser */
    }
  }
}

function startBgmPlayback(howl: Howl) {
  if (bgmHowl !== howl || !currentBgm) return

  const targetVol = effectiveBgmVolume()
  if (targetVol <= 0) return

  const curVol = howl.playing() ? howl.volume() : 0
  if (howl.playing() && curVol > 0.02) {
    howl.fade(curVol, targetVol, BGM_FADE_MS)
    return
  }

  howl.stop()
  howl.seek(0)
  howl.volume(0)
  const soundId = howl.play()
  if (soundId === undefined) return

  howl.fade(0, targetVol, BGM_FADE_MS)
}

function playBgmWhenReady(howl: Howl) {
  if (bgmHowl !== howl || !currentBgm) return

  const start = () => {
    void resumeAudioContext().then(() => startBgmPlayback(howl))
  }

  if (howl.state() === 'loaded') start()
  else howl.once('load', start)
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

/** Inicializa BGM no carregamento do site (preload + primeira faixa). */
export function bootstrapAudio(initialTrack: BgmTrack | null = 'menu') {
  if (initialTrack) getBgmHowl(initialTrack)
  getSfxHowl('goal')
  void resumeAudioContext()
  if (initialTrack && !document.hidden) setBgm(initialTrack)
}

export function setAudioVolumes(next: AudioVolumes) {
  volumes = next
  syncSfxHowlMasters()
  if (bgmHowl) {
    applyBgmVolume()
    if (effectiveBgmVolume() > 0) ensureBgmPlaying()
  }
}

export function stopSfx(id: SfxId) {
  const howl = sfxHowls.get(id)
  if (!howl) return
  if (shouldDuckBgm(id) && howl.playing()) endBgmDuck()
  howl.stop()
}

/** Reinicia um SFX one-shot (ex.: countdown-tick entre rodadas). */
export function replaySfx(
  id: SfxId,
  options?: { volume?: number; rate?: number },
) {
  const howl = getSfxHowl(id)
  if (!howl) return

  const play = () => {
    howl.stop()
    howl.seek(0)
    void resumeAudioContext().then(() => {
      if (sfxSettingsVolume() <= 0) return
      howl.volume(sfxSettingsVolume())
      if (shouldDuckBgm(id)) beginBgmDuck()
      const soundId = howl.play()
      if (soundId === undefined) {
        if (shouldDuckBgm(id)) endBgmDuck()
        return
      }
      applySfxPlaybackGain(howl, soundId, options?.volume ?? 1)
      if (options?.rate !== undefined) {
        howl.rate(options.rate, soundId)
      }
      bindBgmUnduck(howl, id, soundId)
    })
  }

  if (howl.state() === 'loaded') play()
  else howl.once('load', play)
}

export function playSfx(
  id: SfxId,
  options?: { volume?: number; rate?: number },
) {
  const howl = getSfxHowl(id)
  if (!howl) return

  if (sfxSettingsVolume() <= 0) return

  howl.volume(sfxSettingsVolume())
  if (shouldDuckBgm(id)) beginBgmDuck()
  const soundId = howl.play()
  if (soundId === undefined) {
    if (shouldDuckBgm(id)) endBgmDuck()
    return
  }

  applySfxPlaybackGain(howl, soundId, options?.volume ?? 1)
  if (options?.rate !== undefined) {
    howl.rate(options.rate, soundId)
  }
  bindBgmUnduck(howl, id, soundId)
}

export function setBgm(track: BgmTrack | null) {
  if (track === currentBgm) {
    ensureBgmPlaying()
    return
  }

  bgmDuckCount = 0

  const prev = bgmHowl
  currentBgm = track

  if (!track) {
    bgmHowl = null
    if (prev) fadeOutAndStop(prev)
    return
  }

  const next = getBgmHowl(track)
  bgmHowl = next

  if (prev && prev !== next) {
    prev.stop()
    prev.volume(0)
  }

  playBgmWhenReady(next)
}

export function stopBgm() {
  setBgm(null)
}
