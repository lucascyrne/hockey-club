import { useEffect } from 'react'
import { useSessionStore } from '../../stores/sessionStore'

/** Sincroniza aba oculta / minimizada com pausa do jogo (sessionStore.appHidden). */
export function VisibilityHost() {
  const setAppHidden = useSessionStore((s) => s.setAppHidden)

  useEffect(() => {
    const sync = () => setAppHidden(document.hidden)
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [setAppHidden])

  return null
}
