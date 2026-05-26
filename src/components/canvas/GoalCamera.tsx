import { PerspectiveCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { PerspectiveCamera as ThreePerspectiveCamera } from 'three'
import * as THREE from 'three'
import {
  GOAL_CAM_FAR,
  GOAL_CAM_FOV,
  GOAL_CAM_NEAR,
  getGoalCameraConfig,
} from '../../constants/camera'
import { registerGoalCamera } from '../../lib/cameraRegistry'
import type { PlayerId } from '../../systems/bounds'

type GoalCameraProps = {
  playerId: PlayerId
  makeDefault?: boolean
}

export function GoalCamera({ playerId, makeDefault = false }: GoalCameraProps) {
  const cameraRef = useRef<ThreePerspectiveCamera>(null)
  const config = getGoalCameraConfig(playerId)
  const lookAt = useRef(new THREE.Vector3(...config.lookAt))

  useEffect(() => {
    const cam = cameraRef.current
    if (!cam) return
    return registerGoalCamera(playerId, cam)
  }, [playerId])

  useFrame(() => {
    const cam = cameraRef.current
    if (!cam) return
    cam.position.set(...config.position)
    cam.lookAt(lookAt.current)
    cam.fov = GOAL_CAM_FOV
    cam.updateProjectionMatrix()
  })

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault={makeDefault}
      fov={GOAL_CAM_FOV}
      near={GOAL_CAM_NEAR}
      far={GOAL_CAM_FAR}
      position={config.position}
    />
  )
}
