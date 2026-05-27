/** Largura do gol (abertura central nas pontas ±X). */
export const GOAL_WIDTH = 0.35
export const GOAL_HALF_WIDTH = GOAL_WIDTH / 2

export const WIN_TARGET = 7
/** Duração da calha após gol (ms). */
export const PUCK_CHUTE_MS = 400
export const DEMO_PUCK_CHUTE_MS = 280
/** Profundidade do disco na calha (m, ao longo de X). */
export const PUCK_CHUTE_DEPTH_X = 0.14
export const PUCK_CHUTE_DROP_Y = 0.06

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

/** Contagem antes do saque lateral (ms por passo 1/2/3). */
export const ROUND_COUNTDOWN_STEP_MS = 420
/** Exibição de “DISCO” antes do impulso (ms). */
export const ROUND_COUNTDOWN_PUCK_MS = 620
