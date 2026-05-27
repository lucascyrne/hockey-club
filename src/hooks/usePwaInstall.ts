import { useCallback, useEffect, useState } from 'react'
import { isEmbeddedFrame, isIosDevice, isStandalonePwa } from '../lib/pwaEnv'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const standalone = isStandalonePwa()

  useEffect(() => {
    if (standalone) return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }

    const onInstalled = () => setDeferred(null)

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [standalone])

  const promptInstall = useCallback(async () => {
    if (!deferred) return false
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') setDeferred(null)
    return outcome === 'accepted'
  }, [deferred])

  const canPrompt = !!deferred && !standalone
  const showIosHint = isIosDevice() && !standalone && !deferred
  const showEmbedHint = isEmbeddedFrame() && !standalone && !canPrompt
  const showDevHint =
    import.meta.env.DEV &&
    !canPrompt &&
    !showIosHint &&
    !showEmbedHint &&
    !standalone

  return {
    canPrompt,
    showIosHint,
    showEmbedHint,
    showDevHint,
    promptInstall,
    standalone,
  }
}
