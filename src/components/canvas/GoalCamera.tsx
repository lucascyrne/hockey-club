import { PerspectiveCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { PerspectiveCamera as ThreePerspectiveCamera } from 'three'
import {
  GOAL_CAM_FAR,
  GOAL_CAM_FOV,
  GOAL_CAM_FOV_MOBILE_VS_CPU,
  GOAL_CAM_NEAR,
  getGoalCameraConfig,
  type CameraProfile,
} from '../../constants/camera'
import { useGameLayout } from '../../hooks/useGameLayout'
import { registerGoalCamera } from '../../lib/cameraRegistry'
import { useSessionStore } from '../../stores/sessionStore'
import type { PlayerId } from '../../systems/bounds'

type GoalCameraProps = {
  playerId: PlayerId
  makeDefault?: boolean
}

export function GoalCamera({ playerId, makeDefault = false }: GoalCameraProps) {
  const { isMobile } = useGameLayout()
  const matchMode = useSessionStore((s) => s.matchMode)
  const profile: CameraProfile = !isMobile
    ? 'default'
    : matchMode === 'local2p'
      ? 'mobile2p'
      : 'mobileVsCpu'
  const cameraRef = useRef<ThreePerspectiveCamera>(null)
  const lookAt = useRef<[number, number, number]>([0, 0, 0])

  useEffect(() => {
    const cam = cameraRef.current
    if (!cam) return
    return registerGoalCamera(playerId, cam)
  }, [playerId])

  const fov = profile === 'mobileVsCpu' ? GOAL_CAM_FOV_MOBILE_VS_CPU : GOAL_CAM_FOV

  useFrame(() => {
    const cam = cameraRef.current
    if (!cam) return
    const config = getGoalCameraConfig(playerId, profile)
    lookAt.current = config.lookAt
    cam.position.set(...config.position)
    cam.lookAt(lookAt.current[0], lookAt.current[1], lookAt.current[2])
    cam.fov = fov
    cam.updateProjectionMatrix()
  })

  const initial = getGoalCameraConfig(playerId, profile)

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault={makeDefault}
      fov={fov}
      near={GOAL_CAM_NEAR}
      far={GOAL_CAM_FAR}
      position={initial.position}
    />
  )
}
