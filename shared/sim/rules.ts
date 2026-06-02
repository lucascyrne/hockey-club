import { GOAL_HALF_WIDTH } from './gameConstants.js'
import { TABLE_WIDTH } from './paddleConstants.js'
import type { PlayerId } from './bounds.js'

const hw = TABLE_WIDTH / 2
export const GOAL_LINE_X_POS = hw - 0.06
export const GOAL_LINE_X_NEG = -hw + 0.06

export function detectGoal(puckX: number, puckZ: number): PlayerId | null {
  if (Math.abs(puckZ) > GOAL_HALF_WIDTH) return null
  if (puckX >= GOAL_LINE_X_POS) return 2
  if (puckX <= GOAL_LINE_X_NEG) return 1
  return null
}
