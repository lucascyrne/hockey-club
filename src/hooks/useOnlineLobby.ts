import { useCallback, useEffect } from 'react'
import { connectWs, disconnectWs, sendC2S } from '../net/wsClient'
import { handleServerMessage } from '../net/onlineHandlers'
import { useOnlineStore } from '../stores/onlineStore'
import { useSessionStore } from '../stores/sessionStore'
import { getWsUrl } from '../lib/wsUrl'

const CONNECT_TIMEOUT_MS = 12_000

export function useOnlineLobbyWs() {
  const setStatus = useOnlineStore((s) => s.setStatus)
  const setError = useOnlineStore((s) => s.setError)

  const sendLobby = useCallback((msg: Parameters<typeof sendC2S>[0]) => {
    if (!sendC2S(msg)) {
      setError('connect_error')
      return false
    }
    return true
  }, [setError])

  useEffect(() => {
    let opened = false
    let timeoutId = 0

    if (!getWsUrl()) {
      setError('ws_missing')
      return
    }

    setStatus('connecting')
    setError(null)

    const clearConnectTimeout = () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      timeoutId = 0
    }

    const armConnectTimeout = () => {
      clearConnectTimeout()
      timeoutId = window.setTimeout(() => {
        if (opened) return
        if (useOnlineStore.getState().status !== 'connecting') return
        setError('connect_error')
        disconnectWs()
      }, CONNECT_TIMEOUT_MS)
    }

    const ok = connectWs({
      onOpen: () => {
        opened = true
        clearConnectTimeout()
        setError(null)
        setStatus('lobby')
      },
      onClose: () => {
        clearConnectTimeout()
        const { status } = useOnlineStore.getState()
        const { screen, matchMode } = useSessionStore.getState()

        if (screen === 'match' && matchMode === 'online') return
        if (status === 'connecting' && !opened) {
          setError('connect_error')
          return
        }

        if (status === 'playing') {
          useOnlineStore.getState().setDisconnectMessage(true)
        } else if (status !== 'error') {
          setError('connect_error')
        }
      },
      onError: () => {
        if (!opened) setError('connect_error')
      },
      onMessage: handleServerMessage,
    })

    if (!ok) {
      setError('ws_missing')
      return
    }

    armConnectTimeout()

    return () => {
      clearConnectTimeout()
      const { screen, matchMode } = useSessionStore.getState()
      if (screen === 'match' && matchMode === 'online') return
      disconnectWs()
    }
  }, [setError, setStatus])

  const createRoom = useCallback(() => {
    setError(null)
    sendLobby({ t: 'create' })
  }, [sendLobby])

  const joinRoom = useCallback(
    (code: string) => {
      setError(null)
      sendLobby({ t: 'join', code })
    },
    [sendLobby],
  )

  const startMatch = useCallback((winTarget: 3 | 5 | 7) => {
    sendLobby({ t: 'start', winTarget })
  }, [sendLobby])

  const leaveRoom = useCallback(() => {
    sendC2S({ t: 'leave' })
    disconnectWs()
  }, [])

  return { createRoom, joinRoom, startMatch, leaveRoom }
}
