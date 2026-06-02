import { useEffect } from 'react'
import { beginRoundCountdown, cancelRoundCountdown } from '../../systems/roundCountdown'
import { isMenuDemoActive } from '../../stores/menuDemoStore'
import { isOnlineMode, useSessionStore } from '../../stores/sessionStore'

/** Inicia contagem + saque lateral ao entrar na partida. */
export function GameBridge() {
  const screen = useSessionStore((s) => s.screen)

  useEffect(() => {
    if (screen !== 'match' || isMenuDemoActive() || isOnlineMode()) return

    const id = window.setTimeout(() => beginRoundCountdown(), 120)
    return () => {
      window.clearTimeout(id)
      cancelRoundCountdown()
    }
  }, [screen])

  return null
}
