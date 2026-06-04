import { describe, expect, it } from 'vitest'
import { resolvePaddlePuckCollision } from './paddleHit.js'
import { PUCK_PADDLE_MIN_DIST } from './puckContact.js'

function mockPuck(x: number, z: number, vx = 0, vz = 0) {
  const state = { x, z, vx, vz }
  return {
    translation: () => ({ x: state.x, y: 0, z: state.z }),
    linvel: () => ({ x: state.vx, y: 0, z: state.vz }),
    setTranslation: (t: { x: number; y: number; z: number }) => {
      state.x = t.x
      state.z = t.z
    },
    setLinvel: (v: { x: number; y: number; z: number }) => {
      state.vx = v.x
      state.vz = v.z
    },
    wakeUp: () => {},
    state,
  }
}

describe('resolvePaddlePuckCollision parity', () => {
  it('aplica impulso mínimo simétrico com hitStrength 1', () => {
    const puck = mockPuck(0.5, 0, -0.5, 0)
    resolvePaddlePuckCollision(
      puck,
      0.5,
      0,
      0.42,
      0,
      { x: 2, z: 0 },
      1,
      1,
      -1,
    )
    expect(puck.state.vx).toBeLessThan(0)
    expect(Math.hypot(puck.state.vx, puck.state.vz)).toBeGreaterThan(1)
  })

  it('hitStrength baixo reduz impulso de saída', () => {
    const strong = mockPuck(0.42 + PUCK_PADDLE_MIN_DIST - 0.01, 0)
    const weak = mockPuck(0.42 + PUCK_PADDLE_MIN_DIST - 0.01, 0)
    resolvePaddlePuckCollision(
      strong,
      strong.state.x,
      0,
      0.42,
      0,
      { x: 1.5, z: 0 },
      1,
      1,
      -1,
    )
    resolvePaddlePuckCollision(
      weak,
      weak.state.x,
      0,
      0.42,
      0,
      { x: 1.5, z: 0 },
      1,
      0.68,
      -1,
    )
    const speedStrong = Math.hypot(strong.state.vx, strong.state.vz)
    const speedWeak = Math.hypot(weak.state.vx, weak.state.vz)
    expect(speedStrong).toBeGreaterThan(speedWeak)
  })
})
