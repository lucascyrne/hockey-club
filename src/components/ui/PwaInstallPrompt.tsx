import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../../i18n'
import '../../styles/pwa-prompt.css'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallPrompt() {
  const { t } = useTranslation()
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      deferredRef.current = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }

    const onInstalled = () => {
      deferredRef.current = null
      setCanInstall(false)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!canInstall) return null

  const onInstall = async () => {
    const prompt = deferredRef.current
    if (!prompt) return
    await prompt.prompt()
    await prompt.userChoice
    deferredRef.current = null
    setCanInstall(false)
  }

  return (
    <div className="pwa-install" role="region" aria-label={t.pwa.install}>
      <button type="button" className="pwa-install__btn" onClick={() => void onInstall()}>
        {t.pwa.install}
      </button>
      <span className="pwa-install__hint">{t.pwa.installHint}</span>
    </div>
  )
}
