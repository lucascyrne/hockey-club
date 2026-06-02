import type { C2S, S2C } from '../../shared/protocol'
import { decodeWireS2C, encodeWire } from '../../shared/protocolCodec'
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
const pendingOutbound: C2S[] = []

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

function flushPending() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return
  while (pendingOutbound.length > 0) {
    const msg = pendingOutbound.shift()!
    socket.send(encodeWire(msg))
  }
}

/** Envia quando o socket estiver OPEN; enfileira em CONNECTING. */
export function sendC2S(msg: C2S): boolean {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(encodeWire(msg))
    return true
  }
  if (socket?.readyState === WebSocket.CONNECTING) {
    pendingOutbound.push(msg)
    return true
  }
  return false
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
    flushPending()
    return true
  }

  if (socket?.readyState === WebSocket.CONNECTING) {
    return true
  }

  intentionalDisconnect = false
  socket = new WebSocket(url)
  socket.binaryType = 'arraybuffer'

  socket.onopen = () => {
    flushPending()
    activeHandlers.onOpen?.()
  }
  socket.onclose = () => {
    pendingOutbound.length = 0
    if (!intentionalDisconnect) activeHandlers.onClose?.()
    if (socket?.readyState === WebSocket.CLOSED) socket = null
  }
  socket.onerror = () => activeHandlers.onError?.()
  socket.onmessage = (ev) => {
    const raw =
      ev.data instanceof ArrayBuffer
        ? new Uint8Array(ev.data)
        : typeof ev.data === 'string'
          ? new TextEncoder().encode(ev.data)
          : null
    if (!raw) return
    const msg = decodeWireS2C(raw)
    if (!msg) return
    activeHandlers.onMessage?.(msg)
    for (const fn of extraMessageListeners) fn(msg)
  }

  return true
}

export function disconnectWs() {
  pendingOutbound.length = 0
  if (!socket) return
  intentionalDisconnect = true
  const s = socket
  socket = null
  activeHandlers = {}
  if (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CONNECTING) {
    s.close()
  }
}
