import type { Translations } from '../types'

export const en: Translations = {
  menu: {
    subtitle: 'Air Hockey 3D · Arcade Neon',
    navModes: 'Game mode',
    vsCpu: {
      label: 'Play vs CPU',
      hint: 'Camera behind your goal · touch or mouse on the table',
    },
    local2p: {
      label: 'Two players',
      hint: 'Face to face · bottom / top half (touch your area)',
    },
    online: {
      label: 'Play online',
      hint: 'Same view behind your goal · network multiplayer',
      badge: 'Coming soon',
    },
    settings: {
      label: 'Settings',
      hint: 'Language, music and sound effects volume',
    },
  },
  settings: {
    title: 'Settings',
    languageSection: 'Language',
    audioSection: 'Audio',
    masterVolume: 'Master volume',
    music: 'Music',
    sfx: 'Effects',
    muteAll: 'Mute all',
    back: 'Back',
  },
  hud: {
    menu: 'Menu',
    openMenu: 'Game menu',
    closeMenu: 'Close',
    help: 'Help',
    language: 'Language',
    restart: 'Play again',
    goal: 'GOAL!',
    victory: 'YOU WIN!',
    cpuWon: 'CPU WINS',
    p2Won: 'P2 WINS',
    hintVsCpu: 'Touch or mouse on table · optional WASD · Space · R',
    hint2p: 'Left/right halves · touch or mouse each side · WASD / arrows',
    hint2pHorizontal: 'Bottom = P1 · top = P2 · one finger per player',
  },
  lang: {
    pt: 'Português',
    en: 'English',
    es: 'Español',
    zh: '中文',
    switcherAria: 'Change language',
  },
}
