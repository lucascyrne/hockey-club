import { GOAL_HALF_WIDTH } from '../constants/game'
import { TABLE_WIDTH } from '../constants/table'
import type { PlayerId } from '../stores/gameStore'

const hw = TABLE_WIDTH / 2
/** Linha de gol nas pontas ±X (atrás das raquetes). */
export const GOAL_LINE_X_POS = hw - 0.06
export const GOAL_LINE_X_NEG = -hw + 0.06

/**
 * Retorna quem marcou: disco entrou no gol adversário (ponta ±X, |z| < abertura).
 * Gol em +X → P2 marcou (defesa de P1). Gol em -X → P1 marcou.
 */
export function detectGoal(puckX: number, puckZ: number): PlayerId | null {
  if (Math.abs(puckZ) > GOAL_HALF_WIDTH) return null

  if (puckX >= GOAL_LINE_X_POS) return 2
  if (puckX <= GOAL_LINE_X_NEG) return 1
  return null
}
