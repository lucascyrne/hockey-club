/** Largura do gol (abertura central nas pontas ±X). */
export const GOAL_WIDTH = 0.35
export const GOAL_HALF_WIDTH = GOAL_WIDTH / 2

export const WIN_TARGET = 7
export const GOAL_PAUSE_MS = 1500
/** Pausa após gol no hero da landing (saque quase imediato). */
export const DEMO_GOAL_PAUSE_MS = 400

/** Watchdog: disco parado na demo — velocidade XZ abaixo disto (m/s). */
export const DEMO_STALL_SPEED = 0.15
/** Tempo contínuo parado antes de forçar novo saque (ms). */
export const DEMO_STALL_MS = 1100
/** Intervalo mínimo entre saques automáticos por stall (ms). */
export const DEMO_STALL_COOLDOWN_MS = 2000

/** Impulso do saque lateral após gol (m/s). */
export const FACEOFF_SPEED_MIN = 2
export const FACEOFF_SPEED_MAX = 3.2
/** Desvio do ângulo em radianos (~±20°). */
export const FACEOFF_ANGLE_JITTER = 0.35
