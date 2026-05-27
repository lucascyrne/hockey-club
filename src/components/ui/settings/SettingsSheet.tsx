import { useTranslation } from '../../../i18n'
import { SettingsPanel, type SettingsCameraMode } from './SettingsPanel'
import '../../../styles/settings.css'

type SettingsSheetProps = {
  open: boolean
  onClose: () => void
  cameraMode: SettingsCameraMode
}

export function SettingsSheet({ open, onClose, cameraMode }: SettingsSheetProps) {
  const { t } = useTranslation()

  if (!open) return null

  return (
    <div
      className="settings-backdrop settings-backdrop--sheet"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="settings-panel settings-panel--sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="settings__header settings__header--sheet">
          <h2 id="settings-sheet-title" className="settings__title">
            {t.settings.title}
          </h2>
          <button
            type="button"
            className="settings__btn settings__btn--close"
            aria-label={t.settings.back}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <SettingsPanel idPrefix="sheet" cameraMode={cameraMode} />

        <footer className="settings__footer">
          <button type="button" className="settings__btn" onClick={onClose}>
            {t.settings.back}
          </button>
        </footer>
      </div>
    </div>
  )
}
