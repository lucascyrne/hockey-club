import { useCallback, useEffect } from 'react'
import { connectWs, disconnectWs, sendC2S } from '../net/wsClient'
import { handleServerMessage } from '../net/onlineHandlers'
import { useOnlineStore } from '../stores/onlineStore'
import { useSessionStore } from '../stores/sessionStore'
import { getWsUrl } from '../lib/wsUrl'

export function useOnlineLobbyWs() {
  const setStatus = useOnlineStore((s) => s.setStatus)
  const setError = useOnlineStore((s) => s.setError)

  useEffect(() => {
    if (!getWsUrl()) {
      setError('ws_missing')
      return
    }

    setStatus('connecting')
    const ok = connectWs({
      onOpen: () => {
        setError(null)
        setStatus('lobby')
      },
      onClose: () => {
        const { status } = useOnlineStore.getState()
        const { screen, matchMode } = useSessionStore.getState()

        if (screen === 'match' && matchMode === 'online') return
        if (status === 'connecting') return

        if (status === 'playing') {
          useOnlineStore.getState().setDisconnectMessage(true)
        } else {
          setError('connect_error')
        }
      },
      onError: () => setError('connect_error'),
      onMessage: handleServerMessage,
    })

    if (!ok) setError('ws_missing')

    return () => {
      const { screen, matchMode } = useSessionStore.getState()
      if (screen === 'match' && matchMode === 'online') return
      disconnectWs()
    }
  }, [setError, setStatus])

  const createRoom = useCallback(() => {
    sendC2S({ t: 'create' })
  }, [])

  const joinRoom = useCallback((code: string) => {
    sendC2S({ t: 'join', code })
  }, [])

  const startMatch = useCallback((winTarget: 3 | 5 | 7) => {
    sendC2S({ t: 'start', winTarget })
  }, [])

  const leaveRoom = useCallback(() => {
    sendC2S({ t: 'leave' })
    disconnectWs()
  }, [])

  return { createRoom, joinRoom, startMatch, leaveRoom }
}
