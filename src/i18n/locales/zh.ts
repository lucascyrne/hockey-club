import type { Translations } from '../types'

export const zh: Translations = {
  menu: {
    subtitle: 'Air Hockey 3D · 街机霓虹',
    navModes: '游戏模式',
    vsCpu: {
      label: '对战 CPU',
      hint: '球门后方视角 · 主要操作：鼠标',
    },
    local2p: {
      label: '双人本地',
      hint: '左右分屏 · 各半屏鼠标（可选 WASD + 方向键）',
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
    restart: '再来一局',
    goal: '进球！',
    victory: '胜利！',
    cpuWon: 'CPU 获胜',
    p2Won: 'P2 获胜',
    hintVsCpu: '鼠标控制球桌（默认）· 可选 WASD · 空格 · R',
    hint2p: '各半屏鼠标（默认）· 左侧 WASD · 右侧方向键',
  },
  lang: {
    pt: 'Português',
    en: 'English',
    es: 'Español',
    zh: '中文',
    switcherAria: '切换语言',
  },
}
