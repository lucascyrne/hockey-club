import type { PerspectiveCamera } from 'three'
import * as THREE from 'three'
import type { SplitAxis } from './splitViewport'
import { shouldFlipP2View } from './splitViewport'

const viewAxis = new THREE.Vector3()
const savedQ = new THREE.Quaternion()
const savedUp = new THREE.Vector3()

/** Roll 180° na câmera do P2 (split horizontal) — igual ao render. */
export function withP2GoalCameraRoll<T>(
  cam: PerspectiveCamera,
  axis: SplitAxis,
  fn: () => T,
): T {
  if (!shouldFlipP2View(axis)) return fn()

  savedQ.copy(cam.quaternion)
  savedUp.copy(cam.up)
  cam.getWorldDirection(viewAxis)
  cam.rotateOnWorldAxis(viewAxis, Math.PI)
  try {
    return fn()
  } finally {
    cam.quaternion.copy(savedQ)
    cam.up.copy(savedUp)
  }
}
