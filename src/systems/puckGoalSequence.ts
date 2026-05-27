import { PUCK_CHUTE_DEPTH_X, PUCK_CHUTE_DROP_Y } from '../constants/game'
import { PUCK_REST_Y } from '../constants/physics'
import { GOAL_LINE_X_NEG, GOAL_LINE_X_POS } from './rules'
import type { PlayerId } from '../stores/gameStore'

export function computeChuteTarget(
  scorer: PlayerId,
  puckX: number,
  puckY: number,
  puckZ: number,
): { from: { x: number; y: number; z: number }; to: { x: number; y: number; z: number } } {
  const intoGoal = scorer === 2 ? 1 : -1
  const mouthX = scorer === 2 ? GOAL_LINE_X_POS : GOAL_LINE_X_NEG

  return {
    from: { x: puckX, y: puckY, z: puckZ },
    to: {
      x: mouthX + intoGoal * PUCK_CHUTE_DEPTH_X,
      y: PUCK_REST_Y - PUCK_CHUTE_DROP_Y,
      z: puckZ,
    },
  }
}

export function lerpChutePosition(
  from: { x: number; y: number; z: number },
  to: { x: number; y: number; z: number },
  t: number,
): { x: number; y: number; z: number } {
  const u = Math.max(0, Math.min(1, t))
  return {
    x: from.x + (to.x - from.x) * u,
    y: from.y + (to.y - from.y) * u,
    z: from.z + (to.z - from.z) * u,
  }
}
