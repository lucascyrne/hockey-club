import type { Translations } from '../types'

export const es: Translations = {
  menu: {
    subtitle: 'Air Hockey 3D · Arcade Neon',
    navModes: 'Modo de juego',
    vsCpu: {
      label: 'Jugar vs CPU',
      hint: 'Cámara detrás de tu portería · toque o ratón en la mesa',
    },
    local2p: {
      label: 'Dos jugadores',
      hint: 'Cara a cara · mitad inferior / superior (toque en tu zona)',
    },
    online: {
      label: 'Jugar en línea',
      hint: 'Misma vista detrás de tu portería · multijugador en red',
      badge: 'Próximamente',
    },
    settings: {
      label: 'Ajustes',
      hint: 'Idioma, volumen de música y efectos de sonido',
    },
  },
  settings: {
    title: 'Ajustes',
    languageSection: 'Idioma',
    audioSection: 'Audio',
    masterVolume: 'Volumen general',
    music: 'Música',
    sfx: 'Efectos',
    muteAll: 'Silenciar todo',
    back: 'Volver',
  },
  hud: {
    menu: 'Menú',
    openMenu: 'Menú del juego',
    closeMenu: 'Cerrar',
    help: 'Ayuda',
    language: 'Idioma',
    restart: 'Reiniciar',
    goal: '¡GOL!',
    victory: '¡VICTORIA!',
    cpuWon: 'GANA LA CPU',
    p2Won: 'GANA P2',
    hintVsCpu: 'Toque o ratón en la mesa · WASD opcional · Espacio · R',
    hint2p: 'Mitades izq./der. · toque o ratón en cada lado · WASD / flechas',
    hint2pHorizontal: 'Abajo = P1 · arriba = P2 · un dedo por jugador',
  },
  lang: {
    pt: 'Português',
    en: 'English',
    es: 'Español',
    zh: '中文',
    switcherAria: 'Cambiar idioma',
  },
}
