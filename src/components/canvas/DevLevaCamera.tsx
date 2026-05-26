import { PerspectiveCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { PerspectiveCamera as ThreePerspectiveCamera } from 'three'
import { DEFAULT_CAMERA } from '../../constants/table'
import { useCameraControls } from '../../hooks/useCameraControls'

export function DevLevaCamera() {
  const cameraRef = useRef<ThreePerspectiveCamera>(null)
  const { fov, posX, posY, posZ } = useCameraControls()

  useFrame(() => {
    const cam = cameraRef.current
    if (!cam) return
    cam.position.set(posX, posY, posZ)
    cam.lookAt(0, 0, 0)
    cam.fov = fov
    cam.updateProjectionMatrix()
  })

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={DEFAULT_CAMERA.position}
      fov={DEFAULT_CAMERA.fov}
      near={DEFAULT_CAMERA.near}
      far={DEFAULT_CAMERA.far}
    />
  )
}
