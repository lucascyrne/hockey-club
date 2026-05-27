import type { WebSocket } from 'ws'
import type { NetPlayerId, WinTarget } from '../../shared/protocol.js'
import { ROOM_CODE_LEN } from '../../shared/protocol.js'

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const ROOM_TTL_MS = 30 * 60 * 1000

type Peer = {
  ws: WebSocket
  role: NetPlayerId
}

export type Room = {
  code: string
  host: Peer
  guest: Peer | null
  createdAt: number
  lastActivityAt: number
  matchStarted: boolean
  winTarget: WinTarget | null
}

const roomsByCode = new Map<string, Room>()
const roomBySocket = new WeakMap<WebSocket, Room>()

function randomCode(): string {
  let code = ''
  for (let i = 0; i < ROOM_CODE_LEN; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  if (roomsByCode.has(code)) return randomCode()
  return code
}

export function normalizeCode(raw: string): string | null {
  const code = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (code.length !== ROOM_CODE_LEN) return null
  if ([...code].some((c) => !CODE_CHARS.includes(c))) return null
  return code
}

export function createRoom(ws: WebSocket): Room {
  purgeStaleRooms()
  const code = randomCode()
  const room: Room = {
    code,
    host: { ws, role: 1 },
    guest: null,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
    matchStarted: false,
    winTarget: null,
  }
  roomsByCode.set(code, room)
  roomBySocket.set(ws, room)
  return room
}

export function joinRoom(ws: WebSocket, code: string): Room | 'full' | 'missing' {
  purgeStaleRooms()
  const room = roomsByCode.get(code)
  if (!room) return 'missing'
  if (room.guest) return 'full'
  if (room.host.ws === ws) return room

  room.guest = { ws, role: 2 }
  room.lastActivityAt = Date.now()
  roomBySocket.set(ws, room)
  return room
}

export function getRoomForSocket(ws: WebSocket): Room | null {
  return roomBySocket.get(ws) ?? null
}

export function touchRoom(room: Room) {
  room.lastActivityAt = Date.now()
}

export function removePeer(ws: WebSocket) {
  const room = roomBySocket.get(ws)
  if (!room) return

  roomBySocket.delete(ws)

  if (room.host.ws === ws) {
    if (room.guest) {
      try {
        room.guest.ws.close()
      } catch {
        /* ignore */
      }
    }
    roomsByCode.delete(room.code)
    return
  }

  if (room.guest?.ws === ws) {
    room.guest = null
    room.matchStarted = false
    room.winTarget = null
    room.lastActivityAt = Date.now()
  }
}

export function destroyRoom(room: Room) {
  roomsByCode.delete(room.code)
  roomBySocket.delete(room.host.ws)
  if (room.guest) roomBySocket.delete(room.guest.ws)
}

function purgeStaleRooms() {
  const now = Date.now()
  for (const [code, room] of roomsByCode) {
    if (now - room.lastActivityAt > ROOM_TTL_MS) {
      try {
        room.host.ws.close()
      } catch {
        /* ignore */
      }
      if (room.guest) {
        try {
          room.guest.ws.close()
        } catch {
          /* ignore */
        }
      }
      roomsByCode.delete(code)
    }
  }
}

export function sendJson(ws: WebSocket, msg: unknown) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

export function broadcastRoom(room: Room, msg: unknown, except?: WebSocket) {
  if (room.host.ws !== except) sendJson(room.host.ws, msg)
  if (room.guest && room.guest.ws !== except) sendJson(room.guest.ws, msg)
}

export function getPeer(room: Room, ws: WebSocket): Peer | null {
  if (room.host.ws === ws) return room.host
  if (room.guest?.ws === ws) return room.guest
  return null
}

export function getOtherPeer(room: Room, ws: WebSocket): Peer | null {
  if (room.host.ws === ws) return room.guest
  if (room.guest?.ws === ws) return room.host
  return null
}
