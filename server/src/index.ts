import { createServer } from 'node:http'
import { WebSocketServer, type WebSocket } from 'ws'
import {
  MAX_MSG_BYTES,
  parseC2S,
  type C2S,
  type S2C,
} from '../../shared/protocol.js'
import {
  broadcastRoom,
  createRoom,
  getOtherPeer,
  getPeer,
  getRoomForSocket,
  joinRoom,
  normalizeCode,
  removePeer,
  sendJson,
  touchRoom,
} from './rooms.js'

const PORT = Number(process.env.PORT ?? 8787)
function normalizeOriginUrl(s: string): string {
  const t = s.trim()
  return t.endsWith('/') ? t.slice(0, -1) : t
}

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map(normalizeOriginUrl)
  .filter(Boolean)

const rateWindow = new Map<WebSocket, { count: number; resetAt: number }>()
const MAX_MSG_PER_SEC = 40

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true
  const normalized = normalizeOriginUrl(origin)
  return ALLOWED_ORIGINS.some(
    (o) => normalized === o || normalized.startsWith(o),
  )
}

function checkRate(ws: WebSocket): boolean {
  const now = Date.now()
  let entry = rateWindow.get(ws)
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + 1000 }
    rateWindow.set(ws, entry)
  }
  entry.count += 1
  return entry.count <= MAX_MSG_PER_SEC
}

function replyError(ws: WebSocket, code: string) {
  const msg: S2C = { t: 'error', code }
  sendJson(ws, msg)
}

function handleMessage(ws: WebSocket, raw: Buffer | string) {
  if (!checkRate(ws)) return

  const text = typeof raw === 'string' ? raw : raw.toString('utf8')
  if (text.length > MAX_MSG_BYTES) return

  const msg = parseC2S(text)
  if (!msg) return

  switch (msg.t) {
    case 'create':
      handleCreate(ws)
      break
    case 'join':
      handleJoin(ws, msg.code)
      break
    case 'ping':
      sendJson(ws, { t: 'pong', ts: msg.ts })
      break
    case 'ready':
    case 'start':
    case 'input':
    case 'state':
    case 'goal':
    case 'leave':
      handleInRoom(ws, msg)
      break
    default:
      break
  }
}

function handleCreate(ws: WebSocket) {
  if (getRoomForSocket(ws)) {
    replyError(ws, 'already_in_room')
    return
  }
  const room = createRoom(ws)
  const out: S2C = { t: 'room', code: room.code, role: 1 }
  sendJson(ws, out)
}

function handleJoin(ws: WebSocket, rawCode: string) {
  if (getRoomForSocket(ws)) {
    replyError(ws, 'already_in_room')
    return
  }
  const code = normalizeCode(rawCode)
  if (!code) {
    replyError(ws, 'invalid_code')
    return
  }
  const result = joinRoom(ws, code)
  if (result === 'missing') {
    replyError(ws, 'room_not_found')
    return
  }
  if (result === 'full') {
    replyError(ws, 'room_full')
    return
  }
  touchRoom(result)
  sendJson(ws, { t: 'room', code: result.code, role: 2 })
  sendJson(result.host.ws, { t: 'peer', status: 'joined' })
}

function handleInRoom(ws: WebSocket, msg: C2S) {
  const room = getRoomForSocket(ws)
  if (!room) {
    replyError(ws, 'not_in_room')
    return
  }
  touchRoom(room)
  const peer = getPeer(room, ws)
  if (!peer) return

  if (msg.t === 'leave') {
    const other = getOtherPeer(room, ws)
    removePeer(ws)
    if (other) sendJson(other.ws, { t: 'peer', status: 'left' })
    try {
      ws.close()
    } catch {
      /* ignore */
    }
    return
  }

  if (msg.t === 'start') {
    if (peer.role !== 1) return
    room.matchStarted = true
    room.winTarget = msg.winTarget
    const out: S2C = { t: 'match', winTarget: msg.winTarget }
    broadcastRoom(room, out)
    return
  }

  if (msg.t === 'ready') {
    return
  }

  if (msg.t === 'state' || msg.t === 'goal') {
    if (peer.role !== 1) return
    const other = getOtherPeer(room, ws)
    if (!other) return
    sendJson(other.ws, msg as S2C)
    return
  }

  if (msg.t === 'input') {
    if (peer.role !== 2) return
    const other = getOtherPeer(room, ws)
    if (!other) return
    sendJson(other.ws, {
      t: 'remoteInput',
      seq: msg.seq,
      px: msg.px,
      pz: msg.pz,
    })
  }
}

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }
  res.writeHead(404)
  res.end()
})

const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

wss.on('connection', (ws, req) => {
  const origin = req.headers.origin
  if (!isOriginAllowed(origin)) {
    ws.close(1008, 'origin_not_allowed')
    return
  }

  ws.on('message', (data) => handleMessage(ws, data))
  ws.on('close', () => {
    rateWindow.delete(ws)
    const room = getRoomForSocket(ws)
    if (!room) return
    const other = getOtherPeer(room, ws)
    removePeer(ws)
    if (other) sendJson(other.ws, { t: 'peer', status: 'left' })
  })
})

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`hockey-table ws server on 0.0.0.0:${PORT} (path /ws)`)
})
