import { TABLE_WIDTH } from './table'
import type { PlayerId } from '../systems/bounds'

export const GOAL_CAM_FOV = 52
export const GOAL_CAM_NEAR = 0.1
export const GOAL_CAM_FAR = 50

/** Recuo atrás da linha de gol (m). */
const BEHIND_GOAL = 0.62
/** Ponto de mira no campo (metade do jogador, em X). */
const LOOK_AT_X = 0.35
/** Ângulo de depressão tipo arquibancada (45–60°). */
const ELEVATION_DEG = 32

export type GoalCameraConfig = {
  position: [number, number, number]
  lookAt: [number, number, number]
}

function buildGoalCameraConfig(playerId: PlayerId): GoalCameraConfig {
  const sign = playerId === 1 ? 1 : -1
  const halfW = TABLE_WIDTH / 2
  const lookAtX = sign * LOOK_AT_X
  const posX = sign * (halfW + BEHIND_GOAL)
  const horizDist = Math.abs(posX - lookAtX)
  const posY = horizDist * Math.tan((ELEVATION_DEG * Math.PI) / 180)

  return {
    position: [posX, posY, 0],
    lookAt: [lookAtX, 0, 0],
  }
}

const camP1 = buildGoalCameraConfig(1)
const camP2 = buildGoalCameraConfig(2)

export const GOAL_CAM_P1 = camP1
export const GOAL_CAM_P2 = camP2

export function getGoalCameraConfig(playerId: PlayerId): GoalCameraConfig {
  return playerId === 1 ? GOAL_CAM_P1 : GOAL_CAM_P2
}
