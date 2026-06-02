import { useEffect } from 'react'
import { handleServerMessage } from '../net/onlineHandlers'
import { setWsHandlers } from '../net/wsClient'
import { setNetInterpDelayMs, TICK_MS } from '../lib/onlineNetState'
import { useOnlineStore } from '../stores/onlineStore'
import { isOnlineMode, useSessionStore } from '../stores/sessionStore'
import { usePing } from './usePing'

/** Partida online: RTT, handlers WS e disconnect. */
export function useOnlineMatch() {
  const ping = usePing(isOnlineMode())

  useEffect(() => {
    if (ping === null) return
    const ms = ping <= 5 ? TICK_MS : Math.max(TICK_MS, Math.round(ping * 1.25))
    setNetInterpDelayMs(ms)
  }, [ping])

  useEffect(() => {
    if (!isOnlineMode()) return

    setWsHandlers({
      onMessage: handleServerMessage,
      onClose: () => {
        const { screen, matchMode } = useSessionStore.getState()
        if (screen !== 'match' || matchMode !== 'online') return
        useOnlineStore.getState().setDisconnectMessage(true)
        window.setTimeout(() => useSessionStore.getState().exitOnline(), 3000)
      },
    })

    return () => setWsHandlers({})
  }, [])
}
