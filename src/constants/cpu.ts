/** IA defensiva P2 — ver docs/06-game-design.md */
export const CPU_LEAD_TIME = 0.1
export const CPU_SPEED_FACTOR = 0.7
export const CPU_REACTION_MS = 80
export const CPU_ERROR_HALF = 0.03
export const CPU_ERROR_REFRESH_MS = 500
/** Horizonte de ameaça ao gol (predição linear em X). */
export const CPU_THREAT_LEAD_S = 0.45
/** Posição de recuo quando o disco está no campo adversário. */
export const CPU_DEFENSE_X = -0.72
/** Disco neste lado de X: CPU persegue / contra-ataca. */
export const CPU_ATTACK_THRESHOLD_X = -0.2
/** Zona neutra: disco lento aqui obriga ambos os CPUs a atacar. */
export const CPU_CENTER_ENGAGE_X = 0.22
export const CPU_SLOW_PUCK_SPEED = 0.65
