import {
  FACEOFF_ANGLE_JITTER,
  FACEOFF_SPEED_MAX,
  FACEOFF_SPEED_MIN,
} from '../constants/game'
import { PUCK_REST_Y, TABLE_PLAY_HALF_Z } from '../constants/physics'

export type PuckSpawnState = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
}

/**
 * Saque do centro da linha lateral (Z): disco no meio em X,
 * impulso para dentro da mesa com leve viés aleatório para um dos lados/campos.
 */
/** Relançamento pelo centro após gol (impulso radial no plano XZ). */
export function getCenterEjectSpawn(): PuckSpawnState {
  const angle = Math.random() * Math.PI * 2
  const speed =
    FACEOFF_SPEED_MIN +
    Math.random() * (FACEOFF_SPEED_MAX - FACEOFF_SPEED_MIN)

  return {
    x: 0,
    y: PUCK_REST_Y,
    z: 0,
    vx: Math.cos(angle) * speed,
    vy: 0,
    vz: Math.sin(angle) * speed,
  }
}

export function getLateralFaceoffSpawn(): PuckSpawnState {
  const side = Math.random() < 0.5 ? -1 : 1
  const z = side * TABLE_PLAY_HALF_Z * 0.92

  const towardCenterZ = -side
  const biasHalfX = Math.random() < 0.5 ? 1 : -1
  const jitter = (Math.random() - 0.5) * 2 * FACEOFF_ANGLE_JITTER

  let dirX = biasHalfX * 0.55 + Math.sin(jitter) * 0.35
  let dirZ = towardCenterZ * 0.85 + Math.cos(jitter) * 0.25

  const len = Math.hypot(dirX, dirZ) || 1
  dirX /= len
  dirZ /= len

  const speed =
    FACEOFF_SPEED_MIN +
    Math.random() * (FACEOFF_SPEED_MAX - FACEOFF_SPEED_MIN)

  return {
    x: 0,
    y: PUCK_REST_Y,
    z,
    vx: dirX * speed,
    vy: 0,
    vz: dirZ * speed,
  }
}
