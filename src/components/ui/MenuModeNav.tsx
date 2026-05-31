import { Bot, Globe, Settings, User, Users } from 'lucide-react'
import { useTranslation } from '../../i18n'
import type { MatchMode } from '../../stores/sessionStore'
import { MenuIconButton } from './MenuIconButton'

type MenuModeNavProps = {
  onSelect: (mode: MatchMode) => void
  onOpenSettings: () => void
}

export function MenuModeNav({ onSelect, onOpenSettings }: MenuModeNavProps) {
  const { t } = useTranslation()

  return (
    <nav className="main-menu__modes" aria-label={t.menu.navModes}>
      <MenuIconButton
        variant="primary"
        icon={
          <span className="menu-icon-btn__dual">
            <User size={22} strokeWidth={2} />
            <Bot size={20} strokeWidth={2} />
          </span>
        }
        label={t.menu.vsCpu.label}
        hint={t.menu.vsCpu.hint}
        onClick={() => onSelect('vsCpu')}
      />
      <MenuIconButton
        icon={<Users size={26} strokeWidth={2} />}
        label={t.menu.local2p.label}
        hint={t.menu.local2p.hint}
        onClick={() => onSelect('local2p')}
      />
      <MenuIconButton
        icon={<Globe size={26} strokeWidth={2} />}
        label={t.menu.online.label}
        hint={t.menu.online.hint}
        onClick={() => onSelect('online')}
        badge={t.menu.online.badge || undefined}
      />
      <MenuIconButton
        variant="settings"
        icon={<Settings size={26} strokeWidth={2} />}
        label={t.menu.settings.label}
        hint={t.menu.settings.hint}
        onClick={onOpenSettings}
      />
    </nav>
  )
}
