import { useState } from 'react'
import { useTranslation } from '../../i18n'
import { MenuHeroCanvas } from '../menu/MenuHeroCanvas'
import type { MatchMode } from '../../stores/sessionStore'
import { useSessionStore } from '../../stores/sessionStore'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MenuLogo } from './MenuLogo'
import { MenuModeNav } from './MenuModeNav'
import { SettingsModal } from './SettingsModal'
import '../../styles/menu.css'

export function MainMenu() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const startMatch = useSessionStore((s) => s.startMatch)
  const { t } = useTranslation()
  const enterOnlineLobby = useSessionStore((s) => s.enterOnlineLobby)

  const onSelect = (mode: MatchMode) => {
    if (mode === 'online') {
      enterOnlineLobby()
      return
    }
    startMatch(mode)
  }

  return (
    <div className="main-menu">
      <MenuHeroCanvas />
      <div className="main-menu__vignette" aria-hidden />

      <div className="main-menu__toolbar ui-toolbar">
        <LanguageSwitcher />
      </div>

      <div className="main-menu__inner">
        <header className="main-menu__brand">
          <MenuLogo />
          <p className="main-menu__subtitle">{t.menu.subtitle}</p>
        </header>

        <MenuModeNav
          onSelect={onSelect}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
