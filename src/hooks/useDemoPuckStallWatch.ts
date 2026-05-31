import { useEffect, useRef } from 'react'
import {
  DEMO_STALL_COOLDOWN_MS,
  DEMO_STALL_FACEOFF_MS,
  DEMO_STALL_NUDGE_MS,
  DEMO_STALL_NUDGE_SPEED,
  DEMO_STALL_SPEED,
} from '../constants/game'
import { PUCK_PADDLE_MIN_DIST } from '../systems/puckContact'
import { getPuckSample } from '../lib/puckTracker'
import { getPaddlePosition } from '../lib/paddlePositionRegistry'
import { isMenuDemoActive } from '../stores/menuDemoStore'
import { useGameStore } from '../stores/gameStore'
import { usePuckFlowStore } from '../stores/puckFlowStore'
import { nudgePuck, triggerFaceoff } from '../stores/puckActions'
import { getLateralFaceoffSpawn } from '../systems/puckSpawn'
import { resetPaddlesToSpawn } from '../systems/resetRound'

/** Na demo do menu: nudge leve se parado; faceoff só em stall longo ou sanduíche. */
export function useDemoPuckStallWatch() {
  const stallMs = useRef(0)
  const lastAutoFaceoffAt = useRef(0)
  const nudgedThisStall = useRef(false)

  useEffect(() => {
    let raf = 0
    let lastTick = performance.now()

    const tick = (now: number) => {
      const delta = now - lastTick
      lastTick = now

      if (
        isMenuDemoActive() &&
        useGameStore.getState().phase === 'playing' &&
        usePuckFlowStore.getState().flow === 'play'
      ) {
        const puck = getPuckSample()
        const speed = Math.hypot(puck.vx, puck.vz)
        const p1 = getPaddlePosition(1)
        const p2 = getPaddlePosition(2)
        const sandwiched =
          Math.hypot(puck.x - p1.x, puck.z - p1.z) < PUCK_PADDLE_MIN_DIST &&
          Math.hypot(puck.x - p2.x, puck.z - p2.z) < PUCK_PADDLE_MIN_DIST

        if (speed < DEMO_STALL_SPEED) {
          stallMs.current += delta
        } else {
          stallMs.current = 0
          nudgedThisStall.current = false
        }

        if (
          !nudgedThisStall.current &&
          stallMs.current >= DEMO_STALL_NUDGE_MS &&
          speed < DEMO_STALL_SPEED
        ) {
          nudgedThisStall.current = true
          const dirX = Math.abs(puck.x) > 0.08 ? -Math.sign(puck.x) : 1
          const dirZ = (Math.random() - 0.5) * 0.6
          const len = Math.hypot(dirX, dirZ) || 1
          nudgePuck(
            (dirX / len) * DEMO_STALL_NUDGE_SPEED,
            (dirZ / len) * DEMO_STALL_NUDGE_SPEED,
          )
        }

        const faceoffThreshold = sandwiched
          ? DEMO_STALL_NUDGE_MS
          : DEMO_STALL_FACEOFF_MS

        if (
          stallMs.current >= faceoffThreshold &&
          now - lastAutoFaceoffAt.current >= DEMO_STALL_COOLDOWN_MS
        ) {
          stallMs.current = 0
          nudgedThisStall.current = false
          lastAutoFaceoffAt.current = now
          resetPaddlesToSpawn()
          triggerFaceoff(getLateralFaceoffSpawn())
        }
      } else {
        stallMs.current = 0
        nudgedThisStall.current = false
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
}
