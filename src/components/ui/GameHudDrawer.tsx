import { useEffect } from 'react'
import { LOCALES, useTranslation } from '../../i18n'
import type { Locale } from '../../i18n'
import { useSessionStore } from '../../stores/sessionStore'
import '../../styles/game-hud-drawer.css'

type GameHudDrawerProps = {
  hint: string
  showHint: boolean
  onToggleHint: () => void
}

function localeLabel(t: ReturnType<typeof useTranslation>['t'], locale: Locale) {
  return t.lang[locale]
}

export function GameHudDrawer({ hint, showHint, onToggleHint }: GameHudDrawerProps) {
  const { t, locale, setLocale } = useTranslation()
  const exitMatch = useSessionStore((s) => s.exitMatch)
  const open = useSessionStore((s) => s.hudDrawerOpen)
  const setHudDrawerOpen = useSessionStore((s) => s.setHudDrawerOpen)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHudDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setHudDrawerOpen])

  return (
    <>
      <button
        type="button"
        className="game-hud-drawer__toggle"
        aria-label={t.hud.openMenu}
        aria-expanded={open}
        onClick={() => setHudDrawerOpen(!open)}
      >
        <span className="game-hud-drawer__toggle-icon" aria-hidden>
          ☰
        </span>
      </button>

      {open && (
        <div className="game-hud-drawer__backdrop" onClick={() => setHudDrawerOpen(false)}>
          <aside
            className="game-hud-drawer__panel"
            role="dialog"
            aria-label={t.hud.openMenu}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="game-hud-drawer__header">
              <h2 className="game-hud-drawer__title">{t.hud.openMenu}</h2>
              <button
                type="button"
                className="game-hud-drawer__close"
                aria-label={t.hud.closeMenu}
                onClick={() => setHudDrawerOpen(false)}
              >
                ×
              </button>
            </header>

            <section className="game-hud-drawer__section">
              <h3 className="game-hud-drawer__section-title">{t.hud.language}</h3>
              <div className="game-hud-drawer__lang-grid" role="listbox" aria-label={t.hud.language}>
                {LOCALES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    role="option"
                    aria-selected={locale === code}
                    className={`game-hud-drawer__lang-btn${locale === code ? ' game-hud-drawer__lang-btn--active' : ''}`}
                    onClick={() => setLocale(code)}
                  >
                    {localeLabel(t, code)}
                  </button>
                ))}
              </div>
            </section>

            <section className="game-hud-drawer__section">
              <button
                type="button"
                className="game-hud-drawer__action"
                aria-expanded={showHint}
                onClick={onToggleHint}
              >
                {t.hud.help}
              </button>
              {showHint && <p className="game-hud-drawer__hint">{hint}</p>}
            </section>

            <section className="game-hud-drawer__section">
              <button
                type="button"
                className="game-hud-drawer__action game-hud-drawer__action--danger"
                onClick={() => {
                  setHudDrawerOpen(false)
                  exitMatch()
                }}
              >
                {t.hud.menu}
              </button>
            </section>
          </aside>
        </div>
      )}
    </>
  )
}
