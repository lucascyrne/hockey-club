/** Largura do gol (abertura central nas pontas ±X). */
export const GOAL_WIDTH = 0.35
export const GOAL_HALF_WIDTH = GOAL_WIDTH / 2

export const WIN_TARGET = 7
/** Duração do clip `goal.ogg` (ms) — overlay GOL! e fase `goal`. Fallback se Howler ainda não carregou. */
export const GOAL_SFX_MS = 2200
/** Animação da calha do disco após gol (dentro da celebração). */
export const PUCK_CHUTE_MS = 400
export const DEMO_PUCK_CHUTE_MS = 280
/** Profundidade do disco na calha (m, ao longo de X). */
export const PUCK_CHUTE_DEPTH_X = 0.14
export const PUCK_CHUTE_DROP_Y = 0.06

/** Demo hero: vitória praticamente impossível (rally infinito). */
export const DEMO_WIN_TARGET = 999

/** Watchdog: disco parado na demo — velocidade XZ abaixo disto (m/s). */
export const DEMO_STALL_SPEED = 0.15
/** Tempo parado antes de impulso de desbloqueio (ms). */
export const DEMO_STALL_NUDGE_MS = 900
/** Tempo parado antes de faceoff completo (ms). */
export const DEMO_STALL_FACEOFF_MS = 2500
/** Intervalo mínimo entre saques automáticos por stall (ms). */
export const DEMO_STALL_COOLDOWN_MS = 2000
/** Impulso mínimo do nudge anti-stall (m/s). */
export const DEMO_STALL_NUDGE_SPEED = 1.8

/** Impulso do saque lateral após gol (m/s). */
export const FACEOFF_SPEED_MIN = 2
export const FACEOFF_SPEED_MAX = 3.2
/** Desvio do ângulo em radianos (~±20°). */
export const FACEOFF_ANGLE_JITTER = 0.35

/** Duração do clip `countdown-tick` (ms). */
export const COUNTDOWN_TICK_CLIP_MS = 2000
/** Janela dos passos 3→2→1 (ms). */
export const ROUND_COUNTDOWN_NUMERIC_MS = 2000
/** Intervalo entre 3, 2 e 1 (ms). */
export const ROUND_COUNTDOWN_STEP_MS = Math.round(
  ROUND_COUNTDOWN_NUMERIC_MS / 3,
)
/** Exibição de “DISCO” antes do impulso (ms). */
export const ROUND_COUNTDOWN_PUCK_MS = 620
