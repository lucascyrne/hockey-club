/** Ao adicionar chave em pt.ts, replicar em en, es e zh (satisfies Translations). */
export type Locale = 'pt' | 'en' | 'es' | 'zh'

export const LOCALES: Locale[] = ['pt', 'en', 'es', 'zh']

export const LOCALE_HTML_LANG: Record<Locale, string> = {
  pt: 'pt-BR',
  en: 'en',
  es: 'es',
  zh: 'zh-CN',
}

export type Translations = {
  menu: {
    subtitle: string
    navModes: string
    vsCpu: { label: string; hint: string }
    local2p: { label: string; hint: string }
    online: { label: string; hint: string; badge: string }
    settings: { label: string; hint: string }
  }
  settings: {
    title: string
    languageSection: string
    audioSection: string
    gameplaySection: string
    airLevel: string
    airLevelHint: string
    cameraSection: string
    cameraBehind: string
    cameraElevation: string
    cameraLookAt: string
    cameraFov: string
    cameraReset: string
    tabGeneral: string
    tabCamera: string
    tabCameraP1: string
    tabCameraP2: string
    paddleSpeed: string
    paddleSpeedP1: string
    paddleSpeedP2: string
    paddleSpeedHint: string
    winTarget: string
    winTargetHint: string
    cpuDifficulty: string
    cpuLevel1: string
    cpuLevel2: string
    cpuLevel3: string
    cpuLevel1Hint: string
    cpuLevel2Hint: string
    cpuLevel3Hint: string
    masterVolume: string
    music: string
    sfx: string
    muteAll: string
    back: string
  }
  hud: {
    menu: string
    openMenu: string
    closeMenu: string
    settings: string
    help: string
    language: string
    restart: string
    countdownPuck: string
    goal: string
    victory: string
    cpuWon: string
    p2Won: string
    hintVsCpu: string
    hint2p: string
    hint2pHorizontal: string
  }
  lang: {
    pt: string
    en: string
    es: string
    zh: string
    switcherAria: string
  }
  pwa: {
    updateAvailable: string
    reload: string
    later: string
    install: string
    installHint: string
  }
  online: {
    title: string
    create: string
    join: string
    codeLabel: string
    codePlaceholder: string
    waitingPeer: string
    peerJoined: string
    startMatch: string
    copyCode: string
    copyLink: string
    copied: string
    back: string
    connectError: string
    roomFull: string
    invalidCode: string
    peerLeft: string
    youAreHost: string
    youAreGuest: string
    wsMissing: string
  }
}
