import { TABLE_DEPTH, TABLE_WIDTH } from './table'
import { TABLE_SURFACE_TOP } from './physics'

/** Diâmetro da raquete ~12 cm. */
export const PADDLE_RADIUS = 0.06
export const PADDLE_HEIGHT = 0.03
export const PADDLE_HALF_HEIGHT = PADDLE_HEIGHT / 2

export const PADDLE_Y = TABLE_SURFACE_TOP + PADDLE_HALF_HEIGHT + 0.0002

/** Altura das linhas de braço (acima da superfície). */
export const ARM_LINE_Y = TABLE_SURFACE_TOP + 0.04

/** Mesa 2 m (eixo X = comprimento) × 1 m (eixo Z = largura). Jogadores nas pontas ±X. */
export const PADDLE_CENTER_BUFFER = 0.06

export const PADDLE_PLAY_HALF_Z = TABLE_DEPTH / 2 - PADDLE_RADIUS - 0.03
export const PADDLE_PLAY_X_FAR = TABLE_WIDTH / 2 - PADDLE_RADIUS - 0.03

export const PADDLE_P1_X_MIN = PADDLE_CENTER_BUFFER
export const PADDLE_P1_X_MAX = PADDLE_PLAY_X_FAR
export const PADDLE_P2_X_MIN = -PADDLE_PLAY_X_FAR
export const PADDLE_P2_X_MAX = -PADDLE_CENTER_BUFFER

export const MAX_PADDLE_SPEED = 5
/** Taxa de aproximação ao alvo (1/s); maior = mais “colado” ao cursor. */
export const PADDLE_RESPONSE = 28
export const PADDLE_INPUT_SPEED = 3.2

export const PADDLE_TRANSFER_FACTOR = 0.45
export const PADDLE_VELOCITY_SAMPLES = 8

/** Air hockey: atrito quase zero na raquete para não “agarra” o disco. */
export const PADDLE_PHYSICS = {
  friction: 0,
  restitution: 0.92,
} as const

/** Ponto de pivô do braço (gol / fundo do campo). */
export const PADDLE_ARM_ANCHOR = {
  p1: { x: 0.78, z: 0 },
  p2: { x: -0.78, z: 0 },
} as const

export const PADDLE_SPAWN = PADDLE_ARM_ANCHOR
