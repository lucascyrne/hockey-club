import {
  FACEOFF_ANGLE_JITTER,
  FACEOFF_SPEED_MAX,
  FACEOFF_SPEED_MIN,
} from './gameConstants.js'
import { PUCK_REST_Y, TABLE_PLAY_HALF_Z } from './physicsConstants.js'

export type PuckSpawnState = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
}

export function getCenterEjectSpawn(): PuckSpawnState {
  const angle = Math.random() * Math.PI * 2
  const speed =
    FACEOFF_SPEED_MIN + Math.random() * (FACEOFF_SPEED_MAX - FACEOFF_SPEED_MIN)
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
  const angle = (Math.random() * 2 - 1) * FACEOFF_ANGLE_JITTER
  const speed =
    FACEOFF_SPEED_MIN + Math.random() * (FACEOFF_SPEED_MAX - FACEOFF_SPEED_MIN)
  return {
    x: 0,
    y: PUCK_REST_Y,
    z,
    vx: Math.cos(angle) * speed,
    vy: 0,
    vz: Math.sin(angle) * speed * side,
  }
}
