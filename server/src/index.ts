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
import { isOriginAllowed, parseAllowedOrigins } from '../../shared/net/originPolicy.js'
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
const ALLOWED_ORIGINS = parseAllowedOrigins()

const rateWindow = new Map<WebSocket, { count: number; resetAt: number }>()
const MAX_MSG_PER_SEC = 120

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
  const path = req.url?.split('?')[0]
  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }
  res.writeHead(404)
  res.end()
})

const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false })

function onWsConnection(ws: WebSocket, req: import('http').IncomingMessage) {
  const origin = req.headers.origin
  const allowLanInDev = process.env.NODE_ENV !== 'production'
  if (!isOriginAllowed(origin, ALLOWED_ORIGINS, allowLanInDev)) {
    console.warn('[ws] origin rejected:', origin ?? '(none)')
    ws.close(1008, 'origin_not_allowed')
    return
  }

  ws.on('message', (data: Buffer | ArrayBuffer) => {
    const raw = Buffer.isBuffer(data) ? data : Buffer.from(data)
    handleMessage(ws, raw)
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
}

wss.on('connection', onWsConnection)

httpServer.on('upgrade', (req, socket, head) => {
  const path = req.url?.split('?')[0]
  if (path !== '/ws') {
    socket.destroy()
    return
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req)
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
  console.log(
    `hockey-table ws server on 0.0.0.0:${PORT} (path /ws, allowed=${ALLOWED_ORIGINS.join(',')})`,
  )
})
