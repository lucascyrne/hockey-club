import { createServer } from 'node:http'
import { WebSocketServer, type WebSocket } from 'ws'
import { decodeWireC2S, encodeWire } from '../../shared/protocolCodec.js'
import {
  MAX_MSG_BYTES,
  normalizeCode,
  PHYSICS_TIMESTEP,
  type C2S,
  type S2C,
} from '../../shared/protocol.js'
import { MatchSession } from './sim/MatchSession.js'
import { initRapier } from './sim/rapierInit.js'
import {
  broadcastRoom,
  createRoom,
  getOtherPeer,
  getPeer,
  getRoomForSocket,
  joinRoom,
  type Room,
  rematchReadyFlags,
  removePeer,
  sendBinary,
  stopMatchTick,
  touchRoom,
} from './rooms.js'

const PORT = Number(process.env.PORT ?? 8787)
const TICK_MS = Math.round(PHYSICS_TIMESTEP * 1000)

function normalizeOriginUrl(s: string): string {
  const t = s.trim()
  return t.endsWith('/') ? t.slice(0, -1) : t
}

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map(normalizeOriginUrl)
  .filter(Boolean)

const rateWindow = new Map<WebSocket, { count: number; resetAt: number }>()
const MAX_MSG_PER_SEC = 120

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
  sendBinary(ws, encodeWire({ t: 'error', code }))
}

function ensureTickTimer(room: Room) {
  if (room.tickTimer) return
  room.tickTimer = setInterval(() => {
    const session = room.match
    if (!session) return
    const snapshot = session.advance()
    broadcastRoom(room, encodeWire({ t: 'snapshot', snapshot }))
    const scorer = session.consumeGoalEvent()
    if (scorer !== null) {
      broadcastRoom(room, encodeWire({ t: 'goal', scorer }))
    }
  }, TICK_MS)
}

function startMatchLoop(room: Room) {
  if (!room.winTarget || room.match) return
  room.rematchReady.clear()
  room.match = new MatchSession(room.winTarget)
  ensureTickTimer(room)
}

function restartMatchSession(room: Room) {
  if (!room.winTarget || !room.guest) return
  if (room.match) {
    room.match.dispose()
  }
  room.rematchReady.clear()
  room.match = new MatchSession(room.winTarget)
  ensureTickTimer(room)
  broadcastRoom(room, encodeWire({ t: 'match', winTarget: room.winTarget }))
}

function handleMessage(ws: WebSocket, raw: Buffer) {
  if (!checkRate(ws)) return
  if (raw.byteLength > MAX_MSG_BYTES) return

  const msg = decodeWireC2S(raw)
  if (!msg) return

  switch (msg.t) {
    case 'create':
      handleCreate(ws)
      break
    case 'join':
      handleJoin(ws, msg.code)
      break
    case 'ping':
      sendBinary(ws, encodeWire({ t: 'pong', ts: msg.ts }))
      break
    case 'ready':
    case 'start':
    case 'input':
    case 'rematch':
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
  sendBinary(ws, encodeWire({ t: 'room', code: room.code, role: 1 }))
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
  sendBinary(ws, encodeWire({ t: 'room', code: result.code, role: 2 }))
  sendBinary(result.host.ws, encodeWire({ t: 'peer', status: 'joined' }))
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
    stopMatchTick(room)
    removePeer(ws)
    if (other) sendBinary(other.ws, encodeWire({ t: 'peer', status: 'left' }))
    try {
      ws.close()
    } catch {
      /* ignore */
    }
    return
  }

  if (msg.t === 'start') {
    if (peer.role !== 1) return
    if (!room.guest) return
    room.matchStarted = true
    room.winTarget = msg.winTarget
    const out: S2C = { t: 'match', winTarget: msg.winTarget }
    broadcastRoom(room, encodeWire(out))
    startMatchLoop(room)
    return
  }

  if (msg.t === 'ready') return

  if (msg.t === 'input') {
    if (!room.match) return
    if (!Number.isFinite(msg.px) || !Number.isFinite(msg.pz)) return
    room.match.setInput(peer.role, msg.px, msg.pz)
    return
  }

  if (msg.t === 'rematch') {
    if (!room.match || !room.guest) return
    if (room.match.getPhase() !== 'gameOver') return
    room.rematchReady.add(peer.role)
    const ready = rematchReadyFlags(room)
    broadcastRoom(room, encodeWire({ t: 'rematch', ready }))
    if (ready[0] && ready[1]) {
      restartMatchSession(room)
    }
    return
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

  ws.on('message', (data: Buffer) => {
    if (Buffer.isBuffer(data)) handleMessage(ws, data)
    else handleMessage(ws, Buffer.from(data))
  })
  ws.on('close', () => {
    rateWindow.delete(ws)
    const room = getRoomForSocket(ws)
    if (!room) return
    const other = getOtherPeer(room, ws)
    stopMatchTick(room)
    removePeer(ws)
    if (other) sendBinary(other.ws, encodeWire({ t: 'peer', status: 'left' }))
  })
})

await initRapier()

httpServer.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Porta ${PORT} em uso. Feche o outro processo (ex.: outro \`pnpm run dev\` no server) ou use PORT=8788 pnpm run dev`,
    )
    process.exit(1)
  }
  throw err
})

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`hockey-table ws server on 0.0.0.0:${PORT} (path /ws, authoritative sim)`)
})
