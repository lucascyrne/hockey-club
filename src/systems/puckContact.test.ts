import { describe, expect, it } from 'vitest'
import {
  PUCK_PADDLE_MIN_DIST,
  placePuckOnStrikeSide,
  resolvePuckPaddleOverlap,
} from './puckContact'

function mockBody(puckX: number, puckZ: number) {
  const state = { x: puckX, z: puckZ }
  return {
    translation: () => ({ x: state.x, y: 0, z: state.z }),
    linvel: () => ({ x: 0, y: 0, z: 0 }),
    setTranslation: (t: { x: number; y: number; z: number }) => {
      state.x = t.x
      state.z = t.z
    },
    setLinvel: () => {},
    wakeUp: () => {},
    state,
  } as unknown as import('@react-three/rapier').RapierRigidBody & {
    state: { x: number; z: number }
  }
}

describe('resolvePuckPaddleOverlap wrong side', () => {
  it('P2: empurra disco para +X quando está atrás da raquete', () => {
    const paddleX = -0.4
    const puckX = -0.43
    const body = mockBody(puckX, 0)

    const changed = resolvePuckPaddleOverlap(
      body,
      puckX,
      0,
      paddleX,
      0,
      { x: 0, z: 0 },
      -1,
      1,
    )
    expect(changed).toBe(true)
    expect(body.state.x).toBeGreaterThan(puckX)
    expect(body.state.x).toBeGreaterThan(paddleX)
    expect(body.state.x).toBeCloseTo(paddleX + PUCK_PADDLE_MIN_DIST, 3)
  })

  it('P1: empurra disco para -X quando está atrás da raquete', () => {
    const paddleX = 0.4
    const puckX = 0.43
    const body = mockBody(puckX, 0)

    const changed = resolvePuckPaddleOverlap(
      body,
      puckX,
      0,
      paddleX,
      0,
      { x: 0, z: 0 },
      1,
      -1,
    )
    expect(changed).toBe(true)
    expect(body.state.x).toBeLessThan(puckX)
    expect(body.state.x).toBeLessThan(paddleX)
    expect(body.state.x).toBeCloseTo(paddleX - PUCK_PADDLE_MIN_DIST, 3)
  })

  it('placePuckOnStrikeSide fixa X no hemisfério adversário', () => {
    const p = placePuckOnStrikeSide(-0.3, 0.1, 0.12, 1)
    expect(p.x).toBeCloseTo(-0.3 + PUCK_PADDLE_MIN_DIST, 4)
  })
})
