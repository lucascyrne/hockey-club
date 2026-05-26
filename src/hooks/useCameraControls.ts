import { useControls } from 'leva'
import { DEFAULT_CAMERA } from '../constants/table'

export function useCameraControls() {
  return useControls('Câmera', {
    controlMode: {
      value: 'game' as 'game' | 'orbit' | 'leva',
      options: ['game', 'orbit', 'leva'],
      label: 'Modo',
    },
    fov: { value: DEFAULT_CAMERA.fov, min: 30, max: 90, step: 1 },
    posX: { value: DEFAULT_CAMERA.position[0], min: -5, max: 5, step: 0.1 },
    posY: { value: DEFAULT_CAMERA.position[1], min: 0.5, max: 8, step: 0.1 },
    posZ: { value: DEFAULT_CAMERA.position[2], min: 0.5, max: 8, step: 0.1 },
  })
}
