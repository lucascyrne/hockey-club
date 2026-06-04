import type { RapierRigidBody } from '@react-three/rapier'
import { playHitWallSfx } from '../audio/events'
import {
  clampPuckSpeed,
  enforcePuckTableBounds as enforcePuckTableBoundsCore,
  snapPuckToTablePlane,
} from '../../shared/sim/puckBounds'

const WALL_SFX_COOLDOWN_MS = 70
let lastWallSfxAt = 0

export { clampPuckSpeed, snapPuckToTablePlane }

export function enforcePuckTableBounds(body: RapierRigidBody) {
  enforcePuckTableBoundsCore(body, {
    onWallHit: (speed) => {
      const now = performance.now()
      if (now - lastWallSfxAt < WALL_SFX_COOLDOWN_MS) return
      lastWallSfxAt = now
      playHitWallSfx(speed)
    },
  })
}
