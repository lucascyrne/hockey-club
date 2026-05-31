import type { PlanarVelocity } from '../ai/types'
import type { PlayerId } from '../systems/bounds'

export type PaddlePose = {
  x: number
  z: number
  vx: number
  vz: number
}

const poses = new Map<PlayerId, PaddlePose>()

export function registerPaddlePose(playerId: PlayerId, pose: PaddlePose) {
  poses.set(playerId, pose)
}

export function getPaddlePose(playerId: PlayerId): PaddlePose {
  return poses.get(playerId) ?? { x: 0, z: 0, vx: 0, vz: 0 }
}

export function getPaddlePosition(playerId: PlayerId): { x: number; z: number } {
  const p = poses.get(playerId)
  return p ? { x: p.x, z: p.z } : { x: 0, z: 0 }
}

export function getPaddlePlanarVelocity(playerId: PlayerId): PlanarVelocity {
  const p = poses.get(playerId)
  return p ? { x: p.vx, z: p.vz } : { x: 0, z: 0 }
}
