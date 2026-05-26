import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Locale } from '../i18n/types'
import { LOCALE_HTML_LANG } from '../i18n/types'

type LocaleStore = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

function detectBrowserLocale(): Locale {
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('pt')) return 'pt'
  if (lang.startsWith('es')) return 'es'
  if (lang.startsWith('zh')) return 'zh'
  if (lang.startsWith('en')) return 'en'
  return 'pt'
}

export function syncDocumentLocale(locale: Locale) {
  document.documentElement.lang = LOCALE_HTML_LANG[locale]
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: detectBrowserLocale(),

      setLocale: (locale) => {
        set({ locale })
        syncDocumentLocale(locale)
      },
    }),
    {
      name: 'hockey-table-locale',
      onRehydrateStorage: () => (state) => {
        if (state) syncDocumentLocale(state.locale)
      },
    },
  ),
)
