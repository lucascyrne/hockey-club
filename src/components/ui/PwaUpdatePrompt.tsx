import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from '../../i18n'
import '../../styles/pwa-prompt.css'

export function PwaUpdatePrompt() {
  const { t } = useTranslation()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="pwa-prompt" role="status">
      <p className="pwa-prompt__text">{t.pwa.updateAvailable}</p>
      <div className="pwa-prompt__actions">
        <button
          type="button"
          className="pwa-prompt__btn pwa-prompt__btn--primary"
          onClick={() => void updateServiceWorker(true)}
        >
          {t.pwa.reload}
        </button>
        <button
          type="button"
          className="pwa-prompt__btn"
          onClick={() => setNeedRefresh(false)}
        >
          {t.pwa.later}
        </button>
      </div>
    </div>
  )
}
