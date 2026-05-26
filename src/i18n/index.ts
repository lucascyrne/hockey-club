import { useLocaleStore } from '../stores/localeStore'
import { en } from './locales/en'
import { es } from './locales/es'
import { pt } from './locales/pt'
import { zh } from './locales/zh'
import type { Locale, Translations } from './types'

const catalogs: Record<Locale, Translations> = { pt, en, es, zh }

export function getTranslations(locale: Locale): Translations {
  return catalogs[locale]
}

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)
  const t = catalogs[locale]
  return { t, locale, setLocale }
}

export type { Locale, Translations }
export { LOCALES, LOCALE_HTML_LANG } from './types'
