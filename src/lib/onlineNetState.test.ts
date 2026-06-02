import { describe, expect, it } from 'vitest'
import type { SnapshotPayload } from '../../shared/protocol'
import { PADDLE_SPAWN } from '../../shared/sim/paddleConstants'
import { paddleTargets } from '../stores/paddleTargets'
import { useSessionStore } from '../stores/sessionStore'
import {
  applySnapshot,
  isSnapshotDiscontinuity,
  netPaddle,
  netPuck,
  resetOnlineNetState,
  setNetInterpDelayMs,
  snapToLatest,
  stepOnlineInterpolation,
  TICK_MS,
} from './onlineNetState'

function snap(
  tick: number,
  puckX: number,
  puckVx = 0,
  overrides: Partial<SnapshotPayload> = {},
) {
  return {
    serverTime: tick * (1000 / 60),
    tick,
    puck: { x: puckX, z: 0, vx: puckVx, vz: 0 },
    p1: { x: 0.5, z: 0 },
    p2: { x: -0.5, z: 0 },
    phase: 'playing' as const,
    scores: [0, 0] as [number, number],
    countdownStep: null,
    flow: 'play' as const,
    ...overrides,
  }
}

describe('onlineNetState', () => {
  it('seed de spawn após reset', () => {
    resetOnlineNetState()
    expect(netPaddle.p1.x).toBe(PADDLE_SPAWN.p1.x)
    expect(netPaddle.p2.x).toBe(PADDLE_SPAWN.p2.x)
  })

  it('interpola puck por tick com delay > 0', () => {
    resetOnlineNetState()
    setNetInterpDelayMs(TICK_MS * 2)
    for (let tick = 1; tick <= 12; tick++) {
      applySnapshot(snap(tick, tick * 0.05, 6))
    }

    stepOnlineInterpolation()
    expect(netPuck.current.x).toBeGreaterThan(0)
    expect(netPuck.current.x).toBeLessThan(0.8)
  })

  it('LAN (delay 0): segundo snapshot contínuo não sobrescreve net até step', () => {
    resetOnlineNetState()
    setNetInterpDelayMs(TICK_MS)

    applySnapshot(snap(1, 0.4))
    applySnapshot(snap(2, 0.9))
    expect(netPuck.current.x).toBe(0.4)

    stepOnlineInterpolation()
    expect(netPuck.current.x).toBeGreaterThan(0.4)
    expect(netPuck.current.x).toBeLessThan(0.9)
  })

  it('snapToLatest alinha net e histórico a um tick', () => {
    resetOnlineNetState()
    for (let tick = 1; tick <= 5; tick++) {
      applySnapshot(
        snap(tick, 0, 0, { flow: 'held', phase: 'countdown' }),
      )
    }

    const faceoff = snap(6, -0.9, 2.5, { flow: 'play', phase: 'playing' })
    snapToLatest(faceoff)

    expect(netPuck.current.x).toBe(-0.9)
    expect(netPuck.current.vx).toBe(2.5)

    setNetInterpDelayMs(TICK_MS * 2)
    stepOnlineInterpolation()
    expect(netPuck.current.x).toBe(-0.9)
  })

  it('discontinuidade held→play faz snap em applySnapshot', () => {
    resetOnlineNetState()
    applySnapshot(snap(1, 0, 0, { flow: 'held', phase: 'countdown' }))
    applySnapshot(snap(2, 0, 0, { flow: 'held', phase: 'countdown' }))

    applySnapshot(snap(3, -0.85, 2.2, { flow: 'play', phase: 'playing' }))
    expect(netPuck.current.x).toBe(-0.85)
    expect(netPuck.current.vx).toBe(2.2)
  })

  it('isSnapshotDiscontinuity detecta faceoff e countdown→puck', () => {
    const held = snap(1, 0, 0, { flow: 'held', phase: 'countdown' })
    const play = snap(2, 0, 2, { flow: 'play', phase: 'playing' })
    expect(isSnapshotDiscontinuity(held, play)).toBe(true)

    const step2 = snap(3, 0, 0, {
      flow: 'held',
      phase: 'countdown',
      countdownStep: 2,
    })
    const puckStep = snap(4, -0.9, 0, {
      flow: 'held',
      phase: 'countdown',
      countdownStep: 'puck',
    })
    expect(isSnapshotDiscontinuity(step2, puckStep)).toBe(true)
    expect(isSnapshotDiscontinuity(play, snap(5, 0.1, 0))).toBe(false)
  })

  it('não escreve paddle remoto em paddleTargets', () => {
    resetOnlineNetState()
    useSessionStore.setState({ localPlayerId: 1 })
    paddleTargets.p2.x = 0
    paddleTargets.p2.z = 0

    applySnapshot(snap(10, 0))
    applySnapshot(snap(11, 0))
    stepOnlineInterpolation()

    expect(netPaddle.p2.x).toBe(-0.5)
    expect(paddleTargets.p2.x).toBe(0)
    expect(paddleTargets.p2.z).toBe(0)
  })

  it('não altera paddleTargets da raquete local', () => {
    resetOnlineNetState()
    useSessionStore.setState({ localPlayerId: 1 })
    paddleTargets.p1.x = 0.9
    paddleTargets.p1.z = 0

    applySnapshot({
      ...snap(20, 0),
      p1: { x: 0.5, z: 0 },
    })
    applySnapshot({
      ...snap(21, 0),
      p1: { x: 0.5, z: 0 },
    })
    stepOnlineInterpolation()

    expect(paddleTargets.p1.x).toBe(0.9)
  })
})
