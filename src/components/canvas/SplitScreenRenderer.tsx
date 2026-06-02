import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from '../../constants/table'
import { withP2GoalCameraRoll } from '../../lib/p2CameraRoll'
import { getSplitRects } from '../../lib/splitViewport'
import { getGoalCamera } from '../../lib/cameraRegistry'
import { getSplitAxis } from '../../stores/layoutStore'
import { isLocal2pMode } from '../../stores/sessionStore'

const clearColor = new THREE.Color(COLORS.background)

export function SplitScreenRenderer() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const size = useThree((s) => s.size)

  useFrame(() => {
    if (!isLocal2pMode()) return

    const cam1 = getGoalCamera(1)
    const cam2 = getGoalCamera(2)
    if (!cam1 || !cam2) return

    const axis = getSplitAxis()
    const { p1, p2 } = getSplitRects(size.width, size.height, axis)

    gl.setScissorTest(true)
    gl.setClearColor(clearColor)
    gl.clear(true, true, true)

    cam1.aspect = p1.w / p1.h
    cam1.updateProjectionMatrix()
    gl.setViewport(p1.x, p1.y, p1.w, p1.h)
    gl.setScissor(p1.x, p1.y, p1.w, p1.h)
    gl.render(scene, cam1)

    cam2.aspect = p2.w / p2.h
    cam2.updateProjectionMatrix()
    gl.setViewport(p2.x, p2.y, p2.w, p2.h)
    gl.setScissor(p2.x, p2.y, p2.w, p2.h)

    withP2GoalCameraRoll(cam2, axis, () => {
      gl.render(scene, cam2)
    })

    gl.setScissorTest(false)
  }, 2)

  return null
}
