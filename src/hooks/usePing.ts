import { useEffect, useState } from 'react'
import { sendC2S, addMessageListener, isWsConnected } from '../net/wsClient'

const PING_INTERVAL_MS = 2000

export function usePing(enabled = false) {
  const [ping, setPing] = useState<number | null>(null)

  useEffect(() => {
    if (!enabled) return

    const removeListener = addMessageListener((msg) => {
      if (msg.t === 'pong') {
        setPing(Math.round(Date.now() - msg.ts))
      }
    })

    const id = setInterval(() => {
      if (!isWsConnected()) return
      sendC2S({ t: 'ping', ts: Date.now() })
    }, PING_INTERVAL_MS)

    return () => {
      clearInterval(id)
      removeListener()
    }
  }, [enabled])

  return ping
}
