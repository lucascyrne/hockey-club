import type { Translations } from '../types'

export const en: Translations = {
  menu: {
    subtitle: 'Air Hockey 3D · Arcade Neon',
    navModes: 'Game mode',
    vsCpu: {
      label: 'Play vs CPU',
      hint: 'Camera behind your goal · primary control: mouse',
    },
    local2p: {
      label: 'Two players',
      hint: 'Left/right split · mouse on each half (optional WASD + arrows)',
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
    restart: 'Play again',
    goal: 'GOAL!',
    victory: 'YOU WIN!',
    cpuWon: 'CPU WINS',
    p2Won: 'P2 WINS',
    hintVsCpu: 'Mouse on table (default) · optional WASD · Space · R',
    hint2p: 'Mouse per half (default) · WASD left · arrows right',
  },
  lang: {
    pt: 'Português',
    en: 'English',
    es: 'Español',
    zh: '中文',
    switcherAria: 'Change language',
  },
}
