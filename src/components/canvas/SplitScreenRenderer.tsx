import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { COLORS } from '../../constants/table'
import { getSplitRects, shouldFlipP2View } from '../../lib/splitViewport'
import { getGoalCamera } from '../../lib/cameraRegistry'
import { getSplitAxis } from '../../stores/layoutStore'
import { isLocal2pMode } from '../../stores/sessionStore'

const clearColor = new THREE.Color(COLORS.background)

export function SplitScreenRenderer() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const size = useThree((s) => s.size)
  const viewAxis = useMemo(() => new THREE.Vector3(), [])
  const savedQ = useMemo(() => new THREE.Quaternion(), [])
  const savedUp = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    if (!isLocal2pMode()) return

    const cam1 = getGoalCamera(1)
    const cam2 = getGoalCamera(2)
    if (!cam1 || !cam2) return

    const axis = getSplitAxis()
    const flipP2 = shouldFlipP2View(size.width, size.height, axis)
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

    if (flipP2) {
      savedQ.copy(cam2.quaternion)
      savedUp.copy(cam2.up)
      cam2.getWorldDirection(viewAxis)
      cam2.rotateOnWorldAxis(viewAxis, Math.PI)
    }

    gl.render(scene, cam2)

    if (flipP2) {
      cam2.quaternion.copy(savedQ)
      cam2.up.copy(savedUp)
    }

    gl.setScissorTest(false)
  }, 2)

  return null
}
