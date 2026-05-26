import type { PerspectiveCamera } from 'three'
import type { PlayerId } from '../systems/bounds'

const cameras = new Map<PlayerId, PerspectiveCamera>()

export function registerGoalCamera(playerId: PlayerId, camera: PerspectiveCamera) {
  cameras.set(playerId, camera)
  return () => {
    if (cameras.get(playerId) === camera) cameras.delete(playerId)
  }
}

export function getGoalCamera(playerId: PlayerId): PerspectiveCamera | null {
  return cameras.get(playerId) ?? null
}

export function clearGoalCameras() {
  cameras.clear()
}
