import { decode, encode } from '@msgpack/msgpack'
import type { C2S, S2C } from './protocol.js'
import { MAX_MSG_BYTES } from './protocol.js'

export function encodeWire(msg: C2S | S2C): Uint8Array {
  const data = encode(msg)
  if (data.byteLength > MAX_MSG_BYTES) {
    throw new Error('message_too_large')
  }
  return data
}

export function decodeWireC2S(raw: Uint8Array | Buffer): C2S | null {
  try {
    const msg = decode(raw) as C2S
    if (!msg || typeof msg !== 'object' || !('t' in msg)) return null
    return msg
  } catch {
    return null
  }
}

export function decodeWireS2C(raw: Uint8Array | Buffer): S2C | null {
  try {
    const msg = decode(raw) as S2C
    if (!msg || typeof msg !== 'object' || !('t' in msg)) return null
    return msg
  } catch {
    return null
  }
}
