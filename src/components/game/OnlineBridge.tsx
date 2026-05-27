import { useEffect } from 'react'
import { setWsHandlers } from '../../net/wsClient'
import { handleServerMessage } from '../../net/onlineHandlers'
import { useOnlineStore } from '../../stores/onlineStore'
import { useSessionStore } from '../../stores/sessionStore'
import { isOnlineMode } from '../../stores/sessionStore'

/** Handlers WS durante a partida online (mantém socket do lobby). */
export function OnlineBridge() {
  useEffect(() => {
    if (!isOnlineMode()) return

    setWsHandlers({
      onMessage: handleServerMessage,
      onClose: () => {
        const { screen, matchMode } = useSessionStore.getState()
        if (screen !== 'match' || matchMode !== 'online') return
        useOnlineStore.getState().setDisconnectMessage(true)
        window.setTimeout(() => {
          useSessionStore.getState().exitOnline()
        }, 3000)
      },
    })
  }, [])

  return null
}
