import { describe, expect, it } from 'vitest'
import { pointerToNdc, shouldFlipP2View } from './splitViewport'

describe('shouldFlipP2View', () => {
  it('em todo split horizontal (portrait e landscape)', () => {
    expect(shouldFlipP2View('horizontal')).toBe(true)
    expect(shouldFlipP2View('lateral')).toBe(false)
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

  it('P1 e P2 usam vy simétrico em relação à linha de split', () => {
    const p1 = pointerToNdc(200, 600, rect, 1, 'horizontal', false)
    const p2 = pointerToNdc(200, 200, rect, 2, 'horizontal', false)
    expect(p1.y).toBeCloseTo(p2.y, 5)
  })
})
