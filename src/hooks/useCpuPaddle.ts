import { useEffect, useRef } from 'react'
import { getCpuProfile } from '../lib/cpuDifficulty'
import { getPuckSample } from '../lib/puckTracker'
import { useSettingsStore } from '../stores/settingsStore'
import { isLocalMatchPaused, isVsCpuMode } from '../stores/sessionStore'
import { useGameStore } from '../stores/gameStore'
import { paddleTargets } from '../stores/paddleTargets'
import {
  createCpuBehaviorState,
  shouldHoldCpuPosition,
  updateCpuBehavior,
} from '../systems/cpuBehavior'
import { computeCpuIdealTarget, stepCpuPaddleTarget } from '../systems/cpuPaddle'

export function useCpuPaddle() {
  const raf = useRef<number | null>(null)
  const lastTick = useRef(performance.now())
  const delayedPuck = useRef(getPuckSample())
  const lastPuckSampleAt = useRef(0)
  const error = useRef({ x: 0, z: 0 })
  const lastErrorAt = useRef(0)
  const behavior = useRef(createCpuBehaviorState())

  useEffect(() => {
    const tick = (now: number) => {
      const delta = Math.min((now - lastTick.current) / 1000, 0.05)
      lastTick.current = now

      const phase = useGameStore.getState().phase
      if (isVsCpuMode() && phase === 'playing' && !isLocalMatchPaused()) {
        const difficulty = useSettingsStore.getState().cpuDifficulty
        const profile = getCpuProfile(difficulty)

        if (now - lastPuckSampleAt.current >= profile.reactionMs) {
          delayedPuck.current = getPuckSample()
          lastPuckSampleAt.current = now
        }

        if (now - lastErrorAt.current >= profile.errorRefreshMs) {
          error.current = {
            x: (Math.random() - 0.5) * 2 * profile.errorHalf,
            z: (Math.random() - 0.5) * 2 * profile.errorHalf,
          }
          lastErrorAt.current = now
        }

        const puck = delayedPuck.current
        updateCpuBehavior(behavior.current, now, puck, profile)

        if (!shouldHoldCpuPosition(behavior.current, now, puck, profile)) {
          const ideal = computeCpuIdealTarget(
            2,
            puck,
            profile,
            behavior.current.mode,
          )
          stepCpuPaddleTarget(
            2,
            paddleTargets.p2,
            {
              x: ideal.x + error.current.x,
              z: ideal.z + error.current.z,
            },
            delta,
            profile,
          )
        }
      }

      raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
    }
  }, [])
}
