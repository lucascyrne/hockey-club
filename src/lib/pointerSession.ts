import type { PlayerId } from '../systems/bounds'
import {
  pointerToNdc,
  pointerToNdcFullscreen,
  resolvePlayerFromPointer,
  type SplitAxis,
} from './splitViewport'

export { pointerToNdcFullscreen }

/** Associa pointerId → jogador em 2P multitouch. */
export class PointerSession {
  private slots = new Map<number, PlayerId>()

  assign(pointerId: number, clientX: number, clientY: number, rect: DOMRect, axis: SplitAxis) {
    this.slots.set(pointerId, resolvePlayerFromPointer(clientX, clientY, rect, axis))
  }

  bind(pointerId: number, playerId: PlayerId) {
    this.slots.set(pointerId, playerId)
  }

  get(pointerId: number): PlayerId | undefined {
    return this.slots.get(pointerId)
  }

  release(pointerId: number) {
    this.slots.delete(pointerId)
  }

  clear() {
    this.slots.clear()
  }
}

export { pointerToNdc, resolvePlayerFromPointer }
