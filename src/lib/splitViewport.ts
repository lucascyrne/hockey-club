import type { PlayerId } from '../systems/bounds'

export type SplitAxis = 'lateral' | 'horizontal'

export type ViewportRect = {
  x: number
  y: number
  w: number
  h: number
}

/** Touch → horizontal (tablet/mobile); portrait → horizontal; landscape fino → lateral. */
export function resolveSplitAxis(
  width: number,
  height: number,
  coarsePointer = false,
): SplitAxis {
  if (coarsePointer) return 'horizontal'
  return height > width ? 'horizontal' : 'lateral'
}

export function getSplitRects(
  width: number,
  height: number,
  axis: SplitAxis,
): { p1: ViewportRect; p2: ViewportRect } {
  if (axis === 'lateral') {
    const halfW = Math.floor(width / 2)
    const rightW = width - halfW
    return {
      p1: { x: 0, y: 0, w: halfW, h: height },
      p2: { x: halfW, y: 0, w: rightW, h: height },
    }
  }

  const halfH = Math.floor(height / 2)
  const topH = height - halfH
  return {
    p1: { x: 0, y: 0, w: width, h: halfH },
    p2: { x: 0, y: halfH, w: width, h: topH },
  }
}

/** P1 = metade inferior (horizontal) ou esquerda (lateral). */
export function resolvePlayerFromPointer(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  axis: SplitAxis,
): PlayerId {
  const relX = (clientX - rect.left) / rect.width
  const relY = (clientY - rect.top) / rect.height
  if (axis === 'horizontal') {
    return relY >= 0.5 ? 1 : 2
  }
  return relX < 0.5 ? 1 : 2
}

/** NDC em tela cheia (vs CPU / câmera única). */
export function pointerToNdcFullscreen(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): { x: number; y: number } {
  const localX = clientX - rect.left
  const localY = clientY - rect.top
  return {
    x: (localX / rect.width) * 2 - 1,
    y: -(localY / rect.height) * 2 + 1,
  }
}

export function pointerToNdc(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  playerId: PlayerId,
  axis: SplitAxis,
): { x: number; y: number } {
  const localX = clientX - rect.left
  const localY = clientY - rect.top

  if (axis === 'lateral') {
    const halfW = rect.width / 2
    const vx = playerId === 1 ? localX : localX - halfW
    return {
      x: (vx / halfW) * 2 - 1,
      y: -(localY / rect.height) * 2 + 1,
    }
  }

  const halfH = rect.height / 2
  const ndcX = (localX / rect.width) * 2 - 1
  if (playerId === 1) {
    const vy = localY - halfH
    return { x: ndcX, y: -(vy / halfH) * 2 + 1 }
  }
  return { x: ndcX, y: -(localY / halfH) * 2 + 1 }
}
