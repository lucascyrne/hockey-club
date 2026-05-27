import { useState } from 'react'

import { useTranslation } from '../../i18n'

import { useGameLayout } from '../../hooks/useGameLayout'
import { MenuHeroCanvas } from '../menu/MenuHeroCanvas'

import type { MatchMode } from '../../stores/sessionStore'

import { useSessionStore } from '../../stores/sessionStore'

import { LanguageSwitcher } from './LanguageSwitcher'

import { SettingsModal } from './SettingsModal'
import { PwaInstallPrompt } from './PwaInstallPrompt'

import '../../styles/menu.css'



export function MainMenu() {

  const [settingsOpen, setSettingsOpen] = useState(false)

  const startMatch = useSessionStore((s) => s.startMatch)

  const { t } = useTranslation()
  const { reduceMenuFx } = useGameLayout()



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

      {!reduceMenuFx && <MenuHeroCanvas />}

      <div
        className={`main-menu__vignette${reduceMenuFx ? ' main-menu__vignette--static' : ''}`}
        aria-hidden
      />

      <div className="main-menu__toolbar ui-toolbar">

        <LanguageSwitcher />

      </div>

      <div className="main-menu__inner">

        <header className="main-menu__brand">

          <h1 className="main-menu__title">HOCKEY CLUB</h1>

          <p className="main-menu__subtitle">{t.menu.subtitle}</p>

        </header>



        <nav className="main-menu__modes" aria-label={t.menu.navModes}>

          <button

            type="button"

            className="mode-card mode-card--primary"

            onClick={() => onSelect('vsCpu')}

          >

            <span className="mode-card__label">{t.menu.vsCpu.label}</span>

            <span className="mode-card__hint">{t.menu.vsCpu.hint}</span>

          </button>



          <button

            type="button"

            className="mode-card"

            onClick={() => onSelect('local2p')}

          >

            <span className="mode-card__label">{t.menu.local2p.label}</span>

            <span className="mode-card__hint">{t.menu.local2p.hint}</span>

          </button>



          <button type="button" className="mode-card" onClick={() => onSelect('online')}>

            {t.menu.online.badge ? (
              <span className="mode-card__badge">{t.menu.online.badge}</span>
            ) : null}

            <span className="mode-card__label">{t.menu.online.label}</span>

            <span className="mode-card__hint">{t.menu.online.hint}</span>

          </button>



          <button

            type="button"

            className="mode-card mode-card--settings"

            onClick={() => setSettingsOpen(true)}

          >

            <span className="mode-card__label">{t.menu.settings.label}</span>

            <span className="mode-card__hint">{t.menu.settings.hint}</span>

          </button>

        </nav>

        <PwaInstallPrompt />

      </div>



      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

    </div>

  )

}


