import { useEffect, useRef } from 'react'
import {
  DEMO_STALL_COOLDOWN_MS,
  DEMO_STALL_MS,
  DEMO_STALL_SPEED,
} from '../constants/game'
import { getPuckSample } from '../lib/puckTracker'
import { isMenuDemoActive } from '../stores/menuDemoStore'
import { useGameStore } from '../stores/gameStore'
import { triggerFaceoff } from '../stores/puckActions'
import { getLateralFaceoffSpawn } from '../systems/puckSpawn'
import { resetPaddlesToSpawn } from '../systems/resetRound'

/** Na demo do menu, força saque se o disco ficar parado em jogo. */
export function useDemoPuckStallWatch() {
  const stallMs = useRef(0)
  const lastAutoFaceoffAt = useRef(0)

  useEffect(() => {
    let raf = 0
    let lastTick = performance.now()

    const tick = (now: number) => {
      const delta = now - lastTick
      lastTick = now

      if (
        isMenuDemoActive() &&
        useGameStore.getState().phase === 'playing'
      ) {
        const puck = getPuckSample()
        const speed = Math.hypot(puck.vx, puck.vz)

        if (speed < DEMO_STALL_SPEED) {
          stallMs.current += delta
        } else {
          stallMs.current = 0
        }

        if (
          stallMs.current >= DEMO_STALL_MS &&
          now - lastAutoFaceoffAt.current >= DEMO_STALL_COOLDOWN_MS
        ) {
          stallMs.current = 0
          lastAutoFaceoffAt.current = now
          resetPaddlesToSpawn()
          triggerFaceoff(getLateralFaceoffSpawn())
        }
      } else {
        stallMs.current = 0
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
}
