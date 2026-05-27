import { PerspectiveCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { PerspectiveCamera as ThreePerspectiveCamera } from 'three'
import {
  GOAL_CAM_FAR,
  GOAL_CAM_NEAR,
  getGoalCameraConfig,
} from '../../constants/camera'
import { registerGoalCamera } from '../../lib/cameraRegistry'
import { useSettingsStore } from '../../stores/settingsStore'
import type { PlayerId } from '../../systems/bounds'

type GoalCameraProps = {
  playerId: PlayerId
  makeDefault?: boolean
}

export function GoalCamera({ playerId, makeDefault = false }: GoalCameraProps) {
  const cameraRef = useRef<ThreePerspectiveCamera>(null)
  const lookAt = useRef<[number, number, number]>([0, 0, 0])
  const cameraPrefs = useSettingsStore((s) =>
    playerId === 1 ? s.cameraP1 : s.cameraP2,
  )

  useEffect(() => {
    const cam = cameraRef.current
    if (!cam) return
    return registerGoalCamera(playerId, cam)
  }, [playerId])

  useFrame(() => {
    const cam = cameraRef.current
    if (!cam) return
    const config = getGoalCameraConfig(playerId, cameraPrefs)
    lookAt.current = config.lookAt
    cam.position.set(...config.position)
    cam.lookAt(lookAt.current[0], lookAt.current[1], lookAt.current[2])
    cam.fov = cameraPrefs.fov
    cam.updateProjectionMatrix()
  })

  const initial = getGoalCameraConfig(playerId, cameraPrefs)

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault={makeDefault}
      fov={cameraPrefs.fov}
      near={GOAL_CAM_NEAR}
      far={GOAL_CAM_FAR}
      position={initial.position}
    />
  )
}
