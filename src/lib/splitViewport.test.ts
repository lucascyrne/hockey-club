import { describe, expect, it } from 'vitest'
import { pointerToNdc, shouldFlipP2View } from './splitViewport'

describe('shouldFlipP2View', () => {
  it('em todo split horizontal (portrait e landscape)', () => {
    expect(shouldFlipP2View('horizontal')).toBe(true)
    expect(shouldFlipP2View('lateral')).toBe(false)
  })
})

describe('pointerToNdc', () => {
  const rect = { left: 0, top: 0, width: 400, height: 800 } as DOMRect

  it('P1 e P2 usam vy simétrico em relação à linha de split', () => {
    const p1 = pointerToNdc(200, 600, rect, 1, 'horizontal')
    const p2 = pointerToNdc(200, 200, rect, 2, 'horizontal')
    expect(p1.y).toBeCloseTo(p2.y, 5)
  })

  it('horizontal P2: espelha NDC-x de P1 (lateral alinhado ao roll da câmera)', () => {
    const p1 = pointerToNdc(80, 600, rect, 1, 'horizontal')
    const p2 = pointerToNdc(80, 200, rect, 2, 'horizontal')
    expect(p2.x).toBeCloseTo(-p1.x, 5)
  })

  it('lateral: NDC x cresce para a direita em cada metade', () => {
    const p1Left = pointerToNdc(50, 400, rect, 1, 'lateral')
    const p1Right = pointerToNdc(150, 400, rect, 1, 'lateral')
    expect(p1Right.x).toBeGreaterThan(p1Left.x)

    const p2Left = pointerToNdc(250, 400, rect, 2, 'lateral')
    const p2Right = pointerToNdc(350, 400, rect, 2, 'lateral')
    expect(p2Right.x).toBeGreaterThan(p2Left.x)
  })
})
