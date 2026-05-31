import type { ReactNode } from 'react'

export type MenuIconButtonVariant = 'primary' | 'default' | 'settings'

type MenuIconButtonProps = {
  icon: ReactNode
  label: string
  hint: string
  variant?: MenuIconButtonVariant
  onClick: () => void
  disabled?: boolean
  badge?: string
}

export function MenuIconButton({
  icon,
  label,
  hint,
  variant = 'default',
  onClick,
  disabled = false,
  badge,
}: MenuIconButtonProps) {
  return (
    <button
      type="button"
      className={`menu-icon-btn menu-icon-btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={hint}
    >
      {badge ? <span className="menu-icon-btn__badge">{badge}</span> : null}
      <span className="menu-icon-btn__icon" aria-hidden>
        {icon}
      </span>
    </button>
  )
}
