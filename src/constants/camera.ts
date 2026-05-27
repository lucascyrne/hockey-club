import { TABLE_WIDTH } from './table'
import type { PlayerId } from '../systems/bounds'

export const GOAL_CAM_FOV = 52
export const GOAL_CAM_FOV_MOBILE_VS_CPU = 64
export const GOAL_CAM_NEAR = 0.1
export const GOAL_CAM_FAR = 50

export type CameraProfile = 'default' | 'mobileVsCpu' | 'mobile2p'

const PROFILE_PARAMS: Record<
  CameraProfile,
  { behindGoal: number; lookAtX: number; elevationDeg: number }
> = {
  default: { behindGoal: 0.62, lookAtX: 0.35, elevationDeg: 32 },
  mobileVsCpu: { behindGoal: 1.32, lookAtX: 0.24, elevationDeg: 28 },
  mobile2p: { behindGoal: 0.86, lookAtX: 0.28, elevationDeg: 28 },
}

export type GoalCameraConfig = {
  position: [number, number, number]
  lookAt: [number, number, number]
}

export function buildGoalCameraConfig(
  playerId: PlayerId,
  profile: CameraProfile = 'default',
): GoalCameraConfig {
  const { behindGoal, lookAtX: lookAtMag, elevationDeg } = PROFILE_PARAMS[profile]
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
  profile: CameraProfile = 'default',
): GoalCameraConfig {
  return buildGoalCameraConfig(playerId, profile)
}
