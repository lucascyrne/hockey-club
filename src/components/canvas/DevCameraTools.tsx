import { OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useCameraControls } from '../../hooks/useCameraControls'
import { cameraMode } from '../../stores/cameraMode'
import type { PlayerId } from '../../systems/bounds'
import { DevLevaCamera } from './DevLevaCamera'
import { GoalCamera } from './GoalCamera'

type DevCameraToolsProps = {
  localPlayerId: PlayerId
}

/** Leva + Orbit + câmera de gol — apenas desenvolvimento. */
export function DevCameraTools({ localPlayerId }: DevCameraToolsProps) {
  const { controlMode } = useCameraControls()

  useFrame(() => {
    cameraMode.value = controlMode as typeof cameraMode.value
  })

  if (controlMode === 'leva') {
    return <DevLevaCamera />
  }

  if (controlMode === 'orbit') {
    return (
      <OrbitControls
        keyEvents={false}
        enableDamping
        dampingFactor={0.05}
        minDistance={1.5}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
      />
    )
  }

  return <GoalCamera playerId={localPlayerId} makeDefault />
}
