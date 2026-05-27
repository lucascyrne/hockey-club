import { useTranslation } from '../../i18n'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import '../../styles/pwa-prompt.css'

export function PwaInstallPrompt() {
  const { t } = useTranslation()
  const { canPrompt, showIosHint, showEmbedHint, showDevHint, promptInstall } =
    usePwaInstall()

  if (!canPrompt && !showIosHint && !showEmbedHint && !showDevHint) return null

  if (canPrompt) {
    return (
      <div className="pwa-install pwa-install--floating" role="region" aria-label={t.pwa.install}>
        <button
          type="button"
          className="pwa-install__btn"
          onClick={() => void promptInstall()}
        >
          {t.pwa.install}
        </button>
        <span className="pwa-install__hint">{t.pwa.installHint}</span>
      </div>
    )
  }

  if (showIosHint) {
    return (
      <div className="pwa-install pwa-install--floating pwa-install--hint-only" role="note">
        <p className="pwa-install__ios">{t.pwa.iosHint}</p>
      </div>
    )
  }

  if (showEmbedHint) {
    return (
      <div className="pwa-install pwa-install--floating pwa-install--hint-only" role="note">
        <p className="pwa-install__ios">{t.pwa.embedHint}</p>
      </div>
    )
  }

  return (
    <div className="pwa-install pwa-install--floating pwa-install--hint-only" role="note">
      <p className="pwa-install__dev">{t.pwa.devHint}</p>
    </div>
  )
}
