import { describe, expect, it } from 'vitest'
import {
  isPaddleOvershotPastPuck,
  isPuckBehindPaddle,
  mergeEngageTargetX,
} from './engageGeometry'

describe('engageGeometry', () => {
  const puck = { x: -0.88, z: 0.1, vx: 0, vz: 0 }
  const paddleAhead = { x: -0.55, z: 0.1 }

  it('detects puck behind paddle (P2)', () => {
    expect(isPuckBehindPaddle(puck, paddleAhead, 2)).toBe(true)
    expect(isPaddleOvershotPastPuck(puck, paddleAhead, 2)).toBe(true)
  })

  it('detects paddle ahead of puck toward center (retreat / engage)', () => {
    const p = { x: -0.25, z: 0, vx: 0, vz: 0 }
    const pad = { x: -0.08, z: 0 }
    expect(isPuckBehindPaddle(p, pad, 2)).toBe(true)
    expect(isPaddleOvershotPastPuck(p, pad, 2)).toBe(true)
  })

  it('chase X reaches puck near goal line when capped at CPU_DEFENSE_X', () => {
    const tx = mergeEngageTargetX(puck, -0.72, 2, paddleAhead)
    expect(tx).toBeLessThan(-0.8)
  })
})
