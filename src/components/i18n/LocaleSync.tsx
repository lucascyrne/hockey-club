import { useEffect } from 'react'
import { syncDocumentLocale } from '../../stores/localeStore'
import { useLocaleStore } from '../../stores/localeStore'

/** Mantém html[lang] alinhado ao locale persistido. */
export function LocaleSync() {
  const locale = useLocaleStore((s) => s.locale)

  useEffect(() => {
    syncDocumentLocale(locale)
  }, [locale])

  return null
}
