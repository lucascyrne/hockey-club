import type { Translations } from '../types'

export const zh: Translations = {
  menu: {
    subtitle: 'Air Hockey 3D · 街机霓虹',
    navModes: '游戏模式',
    vsCpu: {
      label: '对战 CPU',
      hint: '球门后方视角 · 触屏或鼠标控制球桌',
    },
    local2p: {
      label: '双人本地',
      hint: '面对面 · 下半屏 / 上半屏（各触各自区域）',
    },
    online: {
      label: '在线对战',
      hint: '同样球门后方视角 · 网络多人',
      badge: '即将推出',
    },
    settings: {
      label: '设置',
      hint: '语言、音乐与音效音量',
    },
  },
  settings: {
    title: '设置',
    languageSection: '语言',
    audioSection: '音频',
    masterVolume: '主音量',
    music: '音乐',
    sfx: '音效',
    muteAll: '全部静音',
    back: '返回',
  },
  hud: {
    menu: '菜单',
    openMenu: '游戏菜单',
    closeMenu: '关闭',
    help: '帮助',
    language: '语言',
    restart: '再来一局',
    goal: '进球！',
    victory: '胜利！',
    cpuWon: 'CPU 获胜',
    p2Won: 'P2 获胜',
    hintVsCpu: '触屏或鼠标控制球桌 · 可选 WASD · 空格 · R',
    hint2p: '左右半屏 · 各侧触屏或鼠标 · WASD / 方向键',
    hint2pHorizontal: '下半屏 = P1 · 上半屏 = P2 · 每人一指',
  },
  lang: {
    pt: 'Português',
    en: 'English',
    es: 'Español',
    zh: '中文',
    switcherAria: '切换语言',
  },
}
