import { useEffect, useState } from 'react'
import { sendC2S, addMessageListener, isWsConnected } from '../net/wsClient'

const PING_INTERVAL_MS = 2000

let sharedPing: number | null = null
let subscriberCount = 0
let intervalId: ReturnType<typeof setInterval> | null = null
const listeners = new Set<(ping: number | null) => void>()

function notify(ping: number | null) {
  sharedPing = ping
  for (const fn of listeners) fn(ping)
}

function startPingLoop() {
  if (intervalId) return
  intervalId = setInterval(() => {
    if (!isWsConnected()) return
    sendC2S({ t: 'ping', ts: Date.now() })
  }, PING_INTERVAL_MS)
}

function stopPingLoop() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

/** RTT partilhado — um único intervalo de ping por sessão WS. */
export function usePing(enabled = false) {
  const [ping, setPing] = useState<number | null>(sharedPing)

  useEffect(() => {
    if (!enabled) return

    subscriberCount += 1
    listeners.add(setPing)
    setPing(sharedPing)
    startPingLoop()

    const removeListener = addMessageListener((msg) => {
      if (msg.t === 'pong') {
        notify(Math.round(Date.now() - msg.ts))
      }
    })

    return () => {
      removeListener()
      listeners.delete(setPing)
      subscriberCount -= 1
      if (subscriberCount <= 0) {
        subscriberCount = 0
        stopPingLoop()
      }
    }
  }, [enabled])

  return ping
}
