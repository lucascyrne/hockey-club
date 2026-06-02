export const TABLE_WIDTH = 2
export const TABLE_DEPTH = 1
export const TABLE_SURFACE_THICKNESS = 0.02
export const TABLE_BORDER_HEIGHT = 0.085

export const TABLE_SURFACE_TOP = TABLE_SURFACE_THICKNESS

export const PADDLE_RADIUS = 0.06
export const PADDLE_HEIGHT = 0.03
export const PADDLE_HALF_HEIGHT = PADDLE_HEIGHT / 2
export const PADDLE_Y = TABLE_SURFACE_TOP + PADDLE_HALF_HEIGHT + 0.0002

export const PADDLE_CENTER_BUFFER = 0.06
export const PADDLE_PLAY_HALF_Z = TABLE_DEPTH / 2 - PADDLE_RADIUS - 0.03
export const PADDLE_PLAY_X_FAR = TABLE_WIDTH / 2 - PADDLE_RADIUS - 0.03

export const PADDLE_P1_X_MIN = PADDLE_CENTER_BUFFER
export const PADDLE_P1_X_MAX = PADDLE_PLAY_X_FAR
export const PADDLE_P2_X_MIN = -PADDLE_PLAY_X_FAR
export const PADDLE_P2_X_MAX = -PADDLE_CENTER_BUFFER

export const MAX_PADDLE_SPEED = 5
export const PADDLE_RESPONSE = 28

export const PADDLE_PHYSICS = { friction: 0, restitution: 0.92 } as const

export const PADDLE_SPAWN = {
  p1: { x: 0.78, z: 0 },
  p2: { x: -0.78, z: 0 },
} as const
