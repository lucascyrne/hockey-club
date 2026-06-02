import { describe, expect, it } from 'vitest'
import { pointerToNdc, shouldFlipP2View } from './splitViewport'

describe('shouldFlipP2View', () => {
  it('só em split horizontal portrait', () => {
    expect(shouldFlipP2View(400, 800, 'horizontal')).toBe(true)
    expect(shouldFlipP2View(800, 400, 'horizontal')).toBe(false)
    expect(shouldFlipP2View(400, 800, 'lateral')).toBe(false)
  })
})

describe('pointerToNdc flip P2', () => {
  const rect = { left: 0, top: 0, width: 400, height: 800 } as DOMRect

  it('inverte NDC do P2 na metade superior quando flip ativo', () => {
    const base = pointerToNdc(200, 100, rect, 2, 'horizontal', false)
    const flipped = pointerToNdc(200, 100, rect, 2, 'horizontal', true)
    expect(flipped.x).toBe(-base.x)
    expect(flipped.y).toBe(-base.y)
  })
})
