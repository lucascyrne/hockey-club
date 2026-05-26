import { useEffect, useRef } from 'react'
import {
  CPU_ERROR_HALF,
  CPU_ERROR_REFRESH_MS,
  CPU_REACTION_MS,
} from '../constants/cpu'
import { getPuckSample } from '../lib/puckTracker'
import { isVsCpuMode } from '../stores/sessionStore'
import { useGameStore } from '../stores/gameStore'
import { paddleTargets } from '../stores/paddleTargets'
import { computeCpuIdealTarget, stepCpuPaddleTarget } from '../systems/cpuPaddle'

export function useCpuPaddle() {
  const raf = useRef<number | null>(null)
  const lastTick = useRef(performance.now())
  const delayedPuck = useRef(getPuckSample())
  const lastPuckSampleAt = useRef(0)
  const error = useRef({ x: 0, z: 0 })
  const lastErrorAt = useRef(0)

  useEffect(() => {
    const tick = (now: number) => {
      const delta = Math.min((now - lastTick.current) / 1000, 0.05)
      lastTick.current = now

      if (isVsCpuMode() && useGameStore.getState().phase === 'playing') {
        if (now - lastPuckSampleAt.current >= CPU_REACTION_MS) {
          delayedPuck.current = getPuckSample()
          lastPuckSampleAt.current = now
        }

        if (now - lastErrorAt.current >= CPU_ERROR_REFRESH_MS) {
          error.current = {
            x: (Math.random() - 0.5) * 2 * CPU_ERROR_HALF,
            z: (Math.random() - 0.5) * 2 * CPU_ERROR_HALF,
          }
          lastErrorAt.current = now
        }

        const ideal = computeCpuIdealTarget(2, delayedPuck.current)
        stepCpuPaddleTarget(
          2,
          paddleTargets.p2,
          {
            x: ideal.x + error.current.x,
            z: ideal.z + error.current.z,
          },
          delta,
        )
      }

      raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
    }
  }, [])
}
