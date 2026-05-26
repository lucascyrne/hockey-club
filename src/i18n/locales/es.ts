import type { Translations } from '../types'

export const es: Translations = {
  menu: {
    subtitle: 'Air Hockey 3D · Arcade Neon',
    navModes: 'Modo de juego',
    vsCpu: {
      label: 'Jugar vs CPU',
      hint: 'Cámara detrás de tu portería · control principal: ratón',
    },
    local2p: {
      label: 'Dos jugadores',
      hint: 'Pantalla izq./der. · ratón en cada mitad (WASD + flechas opcionales)',
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
    restart: 'Reiniciar',
    goal: '¡GOL!',
    victory: '¡VICTORIA!',
    cpuWon: 'GANA LA CPU',
    p2Won: 'GANA P2',
    hintVsCpu: 'Ratón en la mesa (predeterminado) · WASD opcional · Espacio · R',
    hint2p: 'Ratón por mitad (predeterminado) · WASD izq. · flechas der.',
  },
  lang: {
    pt: 'Português',
    en: 'English',
    es: 'Español',
    zh: '中文',
    switcherAria: 'Cambiar idioma',
  },
}
