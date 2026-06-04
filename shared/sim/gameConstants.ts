export const GOAL_WIDTH = 0.35
export const GOAL_HALF_WIDTH = GOAL_WIDTH / 2
export const TABLE_CORNER_CHAMFER = 0.08
/** Duração do clip goal.ogg (ms) — alinhar com `src/constants/game.ts`. */
export const GOAL_SFX_MS = 2200
export const PUCK_CHUTE_MS = 400
/** Duração do clip `countdown-tick` (ms). */
export const COUNTDOWN_TICK_CLIP_MS = 2000
/** Janela dos passos 3→2→1 (ms). */
export const ROUND_COUNTDOWN_NUMERIC_MS = 2000
export const ROUND_COUNTDOWN_STEP_MS = Math.round(
  ROUND_COUNTDOWN_NUMERIC_MS / 3,
)
export const ROUND_COUNTDOWN_PUCK_MS = 620
export const FACEOFF_SPEED_MIN = 2
export const FACEOFF_SPEED_MAX = 3.2
export const FACEOFF_ANGLE_JITTER = 0.35
