import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from '../../constants/table'
import { getGoalCamera } from '../../lib/cameraRegistry'
import { isLocal2pMode } from '../../stores/sessionStore'

const clearColor = new THREE.Color(COLORS.background)

/**
 * Renderiza a mesma cena em duas metades (P1 esq. / P2 dir.) com câmeras de gol.
 * Prioridade alta: limpa o frame e desenha após o render padrão do R3F.
 */
export function SplitScreenRenderer() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const size = useThree((s) => s.size)

  useFrame(() => {
    if (!isLocal2pMode()) return

    const cam1 = getGoalCamera(1)
    const cam2 = getGoalCamera(2)
    if (!cam1 || !cam2) return

    const w = size.width
    const h = size.height
    const halfW = Math.floor(w / 2)
    const rightW = w - halfW

    gl.setScissorTest(true)
    gl.setClearColor(clearColor)
    gl.clear(true, true, true)

    cam1.aspect = halfW / h
    cam1.updateProjectionMatrix()
    gl.setViewport(0, 0, halfW, h)
    gl.setScissor(0, 0, halfW, h)
    gl.render(scene, cam1)

    cam2.aspect = rightW / h
    cam2.updateProjectionMatrix()
    gl.setViewport(halfW, 0, rightW, h)
    gl.setScissor(halfW, 0, rightW, h)
    gl.render(scene, cam2)

    gl.setScissorTest(false)
  }, 2)

  return null
}
