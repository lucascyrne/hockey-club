export {
  MAX_PADDLE_SPEED,
  PADDLE_CENTER_BUFFER,
  PADDLE_HALF_HEIGHT,
  PADDLE_HEIGHT,
  PADDLE_INPUT_SPEED,
  PADDLE_P1_X_MAX,
  PADDLE_P1_X_MIN,
  PADDLE_P2_X_MAX,
  PADDLE_P2_X_MIN,
  PADDLE_PHYSICS,
  PADDLE_PLAY_HALF_Z,
  PADDLE_PLAY_X_FAR,
  PADDLE_RADIUS,
  PADDLE_RESPONSE,
  PADDLE_SPAWN,
  PADDLE_TRANSFER_FACTOR,
  PADDLE_VELOCITY_SAMPLES,
  PADDLE_Y,
  TABLE_DEPTH,
  TABLE_WIDTH,
} from '../../shared/sim/paddleConstants'

import { PADDLE_SPAWN } from '../../shared/sim/paddleConstants'
import { TABLE_SURFACE_TOP } from '../../shared/sim/physicsConstants'

/** Altura das linhas de braço (acima da superfície). */
export const ARM_LINE_Y = TABLE_SURFACE_TOP + 0.04

/** Ponto de pivô do braço (gol / fundo do campo). */
export const PADDLE_ARM_ANCHOR = PADDLE_SPAWN
