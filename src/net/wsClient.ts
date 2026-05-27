import type { C2S, S2C } from '../../shared/protocol'
import { parseS2C } from '../../shared/protocol'
import { getWsUrl } from '../lib/wsUrl'

export type WsClientHandlers = {
  onOpen?: () => void
  onClose?: () => void
  onMessage?: (msg: S2C) => void
  onError?: () => void
}

let socket: WebSocket | null = null
let activeHandlers: WsClientHandlers = {}
let intentionalDisconnect = false

/** Listeners adicionais de mensagem (ping, etc.) sem sobrescrever o handler principal. */
const extraMessageListeners = new Set<(msg: S2C) => void>()

export function addMessageListener(fn: (msg: S2C) => void) {
  extraMessageListeners.add(fn)
  return () => extraMessageListeners.delete(fn)
}

export function setWsHandlers(handlers: WsClientHandlers) {
  activeHandlers = { ...activeHandlers, ...handlers }
}

export function isWsConnected() {
  return socket?.readyState === WebSocket.OPEN
}

export function connectWs(handlers: WsClientHandlers): boolean {
  const url = getWsUrl()
  if (!url) {
    handlers.onError?.()
    return false
  }

  activeHandlers = { ...activeHandlers, ...handlers }

  if (socket?.readyState === WebSocket.OPEN) {
    handlers.onOpen?.()
    return true
  }

  if (socket?.readyState === WebSocket.CONNECTING) {
    return true
  }

  intentionalDisconnect = false
  socket = new WebSocket(url)

  socket.onopen = () => activeHandlers.onOpen?.()
  socket.onclose = () => {
    if (!intentionalDisconnect) activeHandlers.onClose?.()
    if (socket?.readyState === WebSocket.CLOSED) socket = null
  }
  socket.onerror = () => activeHandlers.onError?.()
  socket.onmessage = (ev) => {
    const msg = parseS2C(String(ev.data))
    if (!msg) return
    activeHandlers.onMessage?.(msg)
    for (const fn of extraMessageListeners) fn(msg)
  }

  return true
}

export function disconnectWs() {
  if (!socket) return
  intentionalDisconnect = true
  const s = socket
  socket = null
  activeHandlers = {}
  if (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CONNECTING) {
    s.close()
  }
}

export function sendC2S(msg: C2S) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return
  socket.send(JSON.stringify(msg))
}
