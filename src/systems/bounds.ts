import {
  PADDLE_P1_X_MAX,
  PADDLE_P1_X_MIN,
  PADDLE_P2_X_MAX,
  PADDLE_P2_X_MIN,
  PADDLE_PLAY_HALF_Z,
} from '../constants/paddle'

export type PlayerId = 1 | 2

export function clampPaddlePosition(x: number, z: number, playerId: PlayerId) {
  const cz = Math.max(-PADDLE_PLAY_HALF_Z, Math.min(PADDLE_PLAY_HALF_Z, z))

  if (playerId === 1) {
    return {
      x: Math.max(PADDLE_P1_X_MIN, Math.min(PADDLE_P1_X_MAX, x)),
      z: cz,
    }
  }

  return {
    x: Math.max(PADDLE_P2_X_MIN, Math.min(PADDLE_P2_X_MAX, x)),
    z: cz,
  }
}
