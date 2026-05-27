import type { ReactNode } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from '../../i18n'
import { PwaInstallPrompt } from '../ui/PwaInstallPrompt'
import '../../styles/pwa-prompt.css'

/** Regista o service worker (uma vez) e prompts PWA. */
export function PwaProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true })

  return (
    <>
      {children}
      <PwaInstallPrompt />
      {needRefresh && (
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
      )}
    </>
  )
}
