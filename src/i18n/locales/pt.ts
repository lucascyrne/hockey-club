import type { Translations } from '../types'

export const pt: Translations = {
  menu: {
    subtitle: 'Air Hockey 3D · Arcade Neon',
    navModes: 'Modo de jogo',
    vsCpu: {
      label: 'Jogar vs CPU',
      hint: 'Câmera atrás do seu gol · controle principal: mouse',
    },
    local2p: {
      label: 'Dois jogadores',
      hint: 'Tela esq./dir. · mouse em cada metade (WASD + setas opcionais)',
    },
    online: {
      label: 'Jogar online',
      hint: 'Mesma visão atrás do seu gol · multiplayer em rede',
      badge: 'Em breve',
    },
    settings: {
      label: 'Configurações',
      hint: 'Idioma, volume da música e efeitos sonoros',
    },
  },
  settings: {
    title: 'Configurações',
    languageSection: 'Idioma',
    audioSection: 'Áudio',
    masterVolume: 'Volume geral',
    music: 'Música',
    sfx: 'Efeitos',
    muteAll: 'Silenciar tudo',
    back: 'Voltar',
  },
  hud: {
    menu: 'Menu',
    restart: 'Recomeçar',
    goal: 'GOL!',
    victory: 'VITÓRIA!',
    cpuWon: 'CPU VENCEU',
    p2Won: 'P2 VENCEU',
    hintVsCpu: 'Mouse na mesa (padrão) · WASD opcional · Espaço · R',
    hint2p: 'Mouse por metade (padrão) · WASD esq. · setas dir.',
  },
  lang: {
    pt: 'Português',
    en: 'English',
    es: 'Español',
    zh: '中文',
    switcherAria: 'Mudar idioma',
  },
}
