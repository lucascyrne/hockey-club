import { PerspectiveCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { PerspectiveCamera as ThreePerspectiveCamera } from 'three'
import * as THREE from 'three'
import { getGoalCameraConfig } from '../../constants/camera'
import {
  HERO_CAM_FAR,
  HERO_CAM_FOV,
  HERO_CAM_NEAR,
  HERO_CYCLE_DURATION,
  HERO_ORBIT_SPEED,
  HERO_PLAYER_DURATION,
  HERO_TRANSITION_DURATION,
  HERO_WIDE_DURATION,
  HERO_WIDE_HEIGHT,
  HERO_WIDE_RADIUS,
} from '../../constants/hero'

function smoothstep(t: number) {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

function widePosition(angle: number, target: THREE.Vector3) {
  target.set(
    Math.cos(angle) * HERO_WIDE_RADIUS,
    HERO_WIDE_HEIGHT,
    Math.sin(angle) * HERO_WIDE_RADIUS,
  )
  return target
}

export function HeroCameraRig() {
  const cameraRef = useRef<ThreePerspectiveCamera>(null)
  const elapsed = useRef(0)
  const pos = useMemo(() => new THREE.Vector3(), [])
  const lookAt = useMemo(() => new THREE.Vector3(), [])
  const wideLook = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const playerConfig = useMemo(() => getGoalCameraConfig(1), [])
  const playerPos = useMemo(
    () => new THREE.Vector3(...playerConfig.position),
    [playerConfig.position],
  )
  const playerLook = useMemo(
    () => new THREE.Vector3(...playerConfig.lookAt),
    [playerConfig.lookAt],
  )
  const fromPos = useMemo(() => new THREE.Vector3(), [])
  const toPos = useMemo(() => new THREE.Vector3(), [])
  const fromLook = useMemo(() => new THREE.Vector3(), [])
  const toLook = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const cam = cameraRef.current
    if (!cam) return

    elapsed.current += delta
    const cycle = elapsed.current % HERO_CYCLE_DURATION
    const orbitAngle = elapsed.current * HERO_ORBIT_SPEED

    const tWideEnd = HERO_WIDE_DURATION
    const tTrans1End = tWideEnd + HERO_TRANSITION_DURATION
    const tPlayerEnd = tTrans1End + HERO_PLAYER_DURATION

    if (cycle < tWideEnd) {
      widePosition(orbitAngle, pos)
      lookAt.copy(wideLook)
    } else if (cycle < tTrans1End) {
      const t = smoothstep((cycle - tWideEnd) / HERO_TRANSITION_DURATION)
      widePosition(orbitAngle, fromPos)
      fromLook.copy(wideLook)
      toPos.copy(playerPos)
      toLook.copy(playerLook)
      pos.lerpVectors(fromPos, toPos, t)
      lookAt.lerpVectors(fromLook, toLook, t)
    } else if (cycle < tPlayerEnd) {
      pos.copy(playerPos)
      lookAt.copy(playerLook)
    } else {
      const t = smoothstep((cycle - tPlayerEnd) / HERO_TRANSITION_DURATION)
      fromPos.copy(playerPos)
      fromLook.copy(playerLook)
      widePosition(orbitAngle, toPos)
      toLook.copy(wideLook)
      pos.lerpVectors(fromPos, toPos, t)
      lookAt.lerpVectors(fromLook, toLook, t)
    }

    cam.position.copy(pos)
    cam.lookAt(lookAt)
    cam.fov = HERO_CAM_FOV
    cam.updateProjectionMatrix()
  })

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={HERO_CAM_FOV}
      near={HERO_CAM_NEAR}
      far={HERO_CAM_FAR}
    />
  )
}
