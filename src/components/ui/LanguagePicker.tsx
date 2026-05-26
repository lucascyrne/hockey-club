import { LOCALES, useTranslation } from '../../i18n'

type LanguagePickerProps = {
  idPrefix?: string
}

export function LanguagePicker({ idPrefix = 'lang' }: LanguagePickerProps) {
  const { t, locale, setLocale } = useTranslation()

  return (
    <div className="settings__lang-grid" role="radiogroup" aria-label={t.settings.languageSection}>
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          role="radio"
          aria-checked={locale === code}
          id={`${idPrefix}-${code}`}
          className={`settings__lang-option${locale === code ? ' settings__lang-option--active' : ''}`}
          onClick={() => setLocale(code)}
        >
          {t.lang[code]}
        </button>
      ))}
    </div>
  )
}
