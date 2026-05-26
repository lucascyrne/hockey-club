import { useEffect, useRef, useState } from 'react'
import { LOCALES, useTranslation } from '../../i18n'
import type { Locale } from '../../i18n'
import '../../styles/ui-toolbar.css'

function GlobeIcon() {
  return (
    <svg
      className="ui-toolbar-btn__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.8 4 6 4 9s-1.5 6.2-4 9M12 3c-2.5 2.8-4 6-4 9s1.5 6.2 4 9" />
    </svg>
  )
}

function localeLabel(t: ReturnType<typeof useTranslation>['t'], locale: Locale) {
  return t.lang[locale]
}

export function LanguageSwitcher() {
  const { t, locale, setLocale } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div className="lang-switcher" ref={rootRef}>
      <button
        type="button"
        className="ui-toolbar-btn"
        aria-label={t.lang.switcherAria}
        title={t.lang.switcherAria}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <GlobeIcon />
      </button>
      {open && (
        <div className="lang-switcher__menu" role="listbox" aria-label={t.lang.switcherAria}>
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={locale === code}
              className={`lang-switcher__option${locale === code ? ' lang-switcher__option--active' : ''}`}
              onClick={() => {
                setLocale(code)
                setOpen(false)
              }}
            >
              {localeLabel(t, code)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
