import { useEffect } from 'react'
import { useTranslation } from '../../i18n'
import { SettingsPanel, type SettingsCameraMode } from './settings/SettingsPanel'
import '../../styles/settings.css'

type SettingsModalProps = {
  open: boolean
  onClose: () => void
  cameraMode?: SettingsCameraMode
}

export function SettingsModal({
  open,
  onClose,
  cameraMode = 'single',
}: SettingsModalProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="settings-backdrop settings-backdrop--modal" onClick={onClose} role="presentation">
      <div
        className="settings-panel settings-panel--modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="settings__header">
          <h2 id="settings-title" className="settings__title">
            {t.settings.title}
          </h2>
        </header>

        <SettingsPanel idPrefix="modal" cameraMode={cameraMode} />

        <footer className="settings__footer">
          <button type="button" className="settings__btn" onClick={onClose}>
            {t.settings.back}
          </button>
        </footer>
      </div>
    </div>
  )
}
