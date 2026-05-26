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
    masterVolume: string
    music: string
    sfx: string
    muteAll: string
    back: string
  }
  hud: {
    menu: string
    restart: string
    goal: string
    victory: string
    cpuWon: string
    p2Won: string
    hintVsCpu: string
    hint2p: string
  }
  lang: {
    pt: string
    en: string
    es: string
    zh: string
    switcherAria: string
  }
}
