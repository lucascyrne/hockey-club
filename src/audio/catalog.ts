import type { BgmTrack, SfxId } from './types'

type SfxEntry = {
  src: string[]
  pool?: number
}

type BgmEntry = {
  src: string[]
  loop: boolean
}

export const SFX_CATALOG: Record<SfxId, SfxEntry> = {
  'hit-paddle-low': {
    src: ['/audio/sfx/hit-paddle-low.ogg', '/audio/sfx/hit-paddle-low.mp3'],
    pool: 3,
  },
  'hit-paddle-high': {
    src: ['/audio/sfx/hit-paddle-high.ogg', '/audio/sfx/hit-paddle-high.mp3'],
    pool: 3,
  },
  'hit-wall-low': {
    src: ['/audio/sfx/hit-wall-low.ogg', '/audio/sfx/hit-wall-low.mp3'],
    pool: 2,
  },
  'hit-wall-high': {
    src: ['/audio/sfx/hit-wall-high.ogg', '/audio/sfx/hit-wall-high.mp3'],
    pool: 2,
  },
  goal: { src: ['/audio/sfx/goal.ogg', '/audio/sfx/goal.mp3'] },
  faceoff: { src: ['/audio/sfx/faceoff.ogg', '/audio/sfx/faceoff.mp3'] },
  'countdown-tick': {
    src: ['/audio/sfx/countdown-tick.ogg'],
    pool: 1,
  },
  'countdown-puck': {
    src: [
      '/audio/sfx/countdown-puck.ogg',
      '/audio/sfx/countdown-puck.mp3',
      '/audio/sfx/faceoff.ogg',
      '/audio/sfx/faceoff.mp3',
    ],
  },
  win: { src: ['/audio/sfx/win.ogg', '/audio/sfx/win.mp3'] },
}

export const BGM_CATALOG: Record<BgmTrack, BgmEntry> = {
  menu: {
    src: ['/audio/bgm/menu.ogg', '/audio/bgm/menu.mp3'],
    loop: true,
  },
  match: {
    src: ['/audio/bgm/match.ogg', '/audio/bgm/match.mp3'],
    loop: true,
  },
}
