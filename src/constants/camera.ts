import { TABLE_WIDTH } from './table'
import type { PlayerId } from '../systems/bounds'

export const GOAL_CAM_FOV = 52
export const GOAL_CAM_FOV_MOBILE_VS_CPU = 64
export const GOAL_CAM_NEAR = 0.1
export const GOAL_CAM_FAR = 50

export type UserCameraPrefs = {
  behindGoal: number
  elevationDeg: number
  lookAtX: number
  fov: number
}

export const DEFAULT_CAMERA_PREFS: UserCameraPrefs = {
  behindGoal: 0.62,
  elevationDeg: 32,
  lookAtX: 0.35,
  fov: GOAL_CAM_FOV,
}

export const CAMERA_PREF_RANGES = {
  behindGoal: { min: 0.35, max: 1.6 },
  elevationDeg: { min: 18, max: 48 },
  lookAtX: { min: 0.1, max: 0.55 },
  fov: { min: 40, max: 72 },
} as const

export type GoalCameraConfig = {
  position: [number, number, number]
  lookAt: [number, number, number]
}

export function buildGoalCameraConfig(
  playerId: PlayerId,
  prefs: UserCameraPrefs = DEFAULT_CAMERA_PREFS,
): GoalCameraConfig {
  const { behindGoal, lookAtX: lookAtMag, elevationDeg } = prefs
  const sign = playerId === 1 ? 1 : -1
  const halfW = TABLE_WIDTH / 2
  const lookAtX = sign * lookAtMag
  const posX = sign * (halfW + behindGoal)
  const horizDist = Math.abs(posX - lookAtX)
  const posY = horizDist * Math.tan((elevationDeg * Math.PI) / 180)

  return {
    position: [posX, posY, 0],
    lookAt: [lookAtX, 0, 0],
  }
}

export function getGoalCameraConfig(
  playerId: PlayerId,
  prefs: UserCameraPrefs = DEFAULT_CAMERA_PREFS,
): GoalCameraConfig {
  return buildGoalCameraConfig(playerId, prefs)
}
