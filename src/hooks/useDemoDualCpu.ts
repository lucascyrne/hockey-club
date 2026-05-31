import { useEffect, useRef } from 'react'
import { getDemoCpuProfile } from '../lib/demoCpu'
import { isMenuDemoActive } from '../stores/menuDemoStore'
import { useGameStore } from '../stores/gameStore'
import {
  createCpuBehaviorState,
  createCpuTimingState,
  tickCpuPlayer,
} from '../systems/cpuTick'

export function useDemoDualCpu() {
  const raf = useRef<number | null>(null)
  const lastTick = useRef(performance.now())
  const p1 = useRef(createCpuTimingState())
  const p2 = useRef(createCpuTimingState())
  const p1Behavior = useRef(createCpuBehaviorState())
  const p2Behavior = useRef(createCpuBehaviorState())

  useEffect(() => {
    const tick = (now: number) => {
      const delta = Math.min((now - lastTick.current) / 1000, 0.05)
      lastTick.current = now

      if (
        isMenuDemoActive() &&
        useGameStore.getState().phase !== 'gameOver'
      ) {
        const demoOpts = { demoMode: true as const }
        tickCpuPlayer(
          1,
          p1.current,
          p1Behavior.current,
          getDemoCpuProfile(1),
          3,
          now,
          delta,
          demoOpts,
        )
        tickCpuPlayer(
          2,
          p2.current,
          p2Behavior.current,
          getDemoCpuProfile(2),
          3,
          now,
          delta,
          demoOpts,
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
