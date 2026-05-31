import { useEffect, useRef } from 'react'
import { getCpuProfile } from '../lib/cpuDifficulty'
import { useSettingsStore } from '../stores/settingsStore'
import { isLocalMatchPaused, isVsCpuMode } from '../stores/sessionStore'
import { useGameStore } from '../stores/gameStore'
import {
  createCpuBehaviorState,
  createCpuTimingState,
  tickCpuPlayer,
} from '../systems/cpuTick'

export function useCpuPaddle() {
  const raf = useRef<number | null>(null)
  const lastTick = useRef(performance.now())
  const state = useRef(createCpuTimingState())
  const behavior = useRef(createCpuBehaviorState())

  useEffect(() => {
    const tick = (now: number) => {
      const delta = Math.min((now - lastTick.current) / 1000, 0.05)
      lastTick.current = now

      const phase = useGameStore.getState().phase
      if (isVsCpuMode() && phase === 'playing' && !isLocalMatchPaused()) {
        const difficulty = useSettingsStore.getState().cpuDifficulty
        const profile = getCpuProfile(difficulty)
        tickCpuPlayer(
          2,
          state.current,
          behavior.current,
          profile,
          difficulty,
          now,
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
