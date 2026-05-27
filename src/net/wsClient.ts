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

export function setWsHandlers(handlers: WsClientHandlers) {
  activeHandlers = { ...activeHandlers, ...handlers }
}

export function isWsConnected() {
  return socket?.readyState === WebSocket.OPEN
}

export function connectWs(handlers: WsClientHandlers): boolean {
  const url = getWsUrl()
  // #region agent log
  fetch('http://127.0.0.1:7694/ingest/8b8788ac-3170-4440-9543-08d1c8d8efcd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4ad1d4'},body:JSON.stringify({sessionId:'4ad1d4',location:'wsClient.ts:connectWs',message:'connect attempt',data:{hasUrl:!!url,host:url?(()=>{try{return new URL(url).host}catch{return 'invalid'}})():null},timestamp:Date.now(),hypothesisId:'C',runId:'pre-fix'})}).catch(()=>{});
  // #endregion
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

  socket.onopen = () => {
    // #region agent log
    fetch('http://127.0.0.1:7694/ingest/8b8788ac-3170-4440-9543-08d1c8d8efcd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4ad1d4'},body:JSON.stringify({sessionId:'4ad1d4',location:'wsClient.ts:onopen',message:'ws open',data:{},timestamp:Date.now(),hypothesisId:'B',runId:'pre-fix'})}).catch(()=>{});
    // #endregion
    activeHandlers.onOpen?.()
  }
  socket.onclose = (ev) => {
    // #region agent log
    fetch('http://127.0.0.1:7694/ingest/8b8788ac-3170-4440-9543-08d1c8d8efcd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4ad1d4'},body:JSON.stringify({sessionId:'4ad1d4',location:'wsClient.ts:onclose',message:'ws close',data:{code:ev.code,reason:ev.reason,intentional:intentionalDisconnect},timestamp:Date.now(),hypothesisId:ev.code===1008?'D':'B',runId:'pre-fix'})}).catch(()=>{});
    // #endregion
    if (!intentionalDisconnect) activeHandlers.onClose?.()
    if (socket?.readyState === WebSocket.CLOSED) socket = null
  }
  socket.onerror = () => {
    // #region agent log
    fetch('http://127.0.0.1:7694/ingest/8b8788ac-3170-4440-9543-08d1c8d8efcd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4ad1d4'},body:JSON.stringify({sessionId:'4ad1d4',location:'wsClient.ts:onerror',message:'ws error',data:{readyState:socket?.readyState},timestamp:Date.now(),hypothesisId:'B',runId:'pre-fix'})}).catch(()=>{});
    // #endregion
    activeHandlers.onError?.()
  }
  socket.onmessage = (ev) => {
    const msg = parseS2C(String(ev.data))
    if (msg) activeHandlers.onMessage?.(msg)
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
