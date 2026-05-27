import type { Translations } from '../types'

export const pt: Translations = {
  menu: {
    subtitle: 'Air Hockey 3D · Arcade Neon',
    navModes: 'Modo de jogo',
    vsCpu: {
      label: 'Jogar vs CPU',
      hint: 'Câmera atrás do seu gol · toque ou mouse na mesa',
    },
    local2p: {
      label: 'Dois jogadores',
      hint: 'Frente a frente · metade de baixo / de cima (toque em cada área)',
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
    openMenu: 'Menu do jogo',
    closeMenu: 'Fechar',
    help: 'Dúvidas',
    language: 'Idioma',
    restart: 'Recomeçar',
    goal: 'GOL!',
    victory: 'VITÓRIA!',
    cpuWon: 'CPU VENCEU',
    p2Won: 'P2 VENCEU',
    hintVsCpu: 'Toque ou mouse na mesa · WASD opcional · Espaço · R',
    hint2p: 'Metades esq./dir. · toque ou mouse em cada lado · WASD / setas',
    hint2pHorizontal: 'Metade de baixo = P1 · de cima = P2 · um dedo por jogador',
  },
  lang: {
    pt: 'Português',
    en: 'English',
    es: 'Español',
    zh: '中文',
    switcherAria: 'Mudar idioma',
  },
}
