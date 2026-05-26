import { useEffect, useRef } from 'react'
import {
  CPU_ERROR_HALF,
  CPU_ERROR_REFRESH_MS,
  CPU_REACTION_MS,
} from '../constants/cpu'
import { getPuckSample } from '../lib/puckTracker'
import { isMenuDemoActive } from '../stores/menuDemoStore'
import { useGameStore } from '../stores/gameStore'
import { paddleTargets } from '../stores/paddleTargets'
import type { PlayerId } from '../systems/bounds'
import { computeCpuIdealTarget, stepCpuPaddleTarget } from '../systems/cpuPaddle'

type CpuErrorState = { x: number; z: number }
type CpuTimingState = {
  delayedPuck: ReturnType<typeof getPuckSample>
  lastPuckSampleAt: number
  error: CpuErrorState
  lastErrorAt: number
}

function createCpuState(): CpuTimingState {
  return {
    delayedPuck: getPuckSample(),
    lastPuckSampleAt: 0,
    error: { x: 0, z: 0 },
    lastErrorAt: 0,
  }
}

function tickCpuPlayer(
  playerId: PlayerId,
  state: CpuTimingState,
  now: number,
  delta: number,
) {
  if (now - state.lastPuckSampleAt >= CPU_REACTION_MS) {
    state.delayedPuck = getPuckSample()
    state.lastPuckSampleAt = now
  }

  if (now - state.lastErrorAt >= CPU_ERROR_REFRESH_MS) {
    state.error = {
      x: (Math.random() - 0.5) * 2 * CPU_ERROR_HALF,
      z: (Math.random() - 0.5) * 2 * CPU_ERROR_HALF,
    }
    state.lastErrorAt = now
  }

  const ideal = computeCpuIdealTarget(playerId, state.delayedPuck)
  const target = playerId === 1 ? paddleTargets.p1 : paddleTargets.p2
  stepCpuPaddleTarget(
    playerId,
    target,
    {
      x: ideal.x + state.error.x,
      z: ideal.z + state.error.z,
    },
    delta,
  )
}

export function useDemoDualCpu() {
  const raf = useRef<number | null>(null)
  const lastTick = useRef(performance.now())
  const p1 = useRef(createCpuState())
  const p2 = useRef(createCpuState())

  useEffect(() => {
    const tick = (now: number) => {
      const delta = Math.min((now - lastTick.current) / 1000, 0.05)
      lastTick.current = now

      if (
        isMenuDemoActive() &&
        useGameStore.getState().phase === 'playing'
      ) {
        tickCpuPlayer(1, p1.current, now, delta)
        tickCpuPlayer(2, p2.current, now, delta)
      }

      raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
    }
  }, [])
}
