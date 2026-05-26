import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { ARM_LINE_Y, PADDLE_ARM_ANCHOR } from '../../constants/paddle'
import { paddleMotionState } from '../../stores/paddleMotionState'
import type { PlayerId } from '../../systems/bounds'

type PlayerArmGuideProps = {
  playerId: PlayerId
  color: string
}

function ArmLine({ color, getEndpoints }: {
  color: string
  getEndpoints: () => [THREE.Vector3, THREE.Vector3]
}) {
  const [line, setLine] = useState<THREE.Line | null>(null)
  const positions = useMemo(() => new Float32Array(6), [])

  useEffect(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    })
    const threeLine = new THREE.Line(geometry, material)
    threeLine.raycast = () => {}
    threeLine.frustumCulled = false
    setLine(threeLine)
    return () => {
      geometry.dispose()
      material.dispose()
      setLine(null)
    }
  }, [color, positions])

  useFrame(() => {
    if (!line) return
    const [a, b] = getEndpoints()
    positions[0] = a.x
    positions[1] = a.y
    positions[2] = a.z
    positions[3] = b.x
    positions[4] = b.y
    positions[5] = b.z
    const attr = line.geometry.attributes.position as THREE.BufferAttribute
    attr.needsUpdate = true
  })

  if (!line) return null
  return <primitive object={line} />
}

function AnchorDot({ color, getPosition }: {
  color: string
  getPosition: () => THREE.Vector3
}) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    mesh.position.copy(getPosition())
  })

  return (
    <mesh ref={ref} raycast={() => null}>
      <sphereGeometry args={[0.025, 12, 12]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} depthWrite={false} />
    </mesh>
  )
}

export function PlayerArmGuide({ playerId, color }: PlayerArmGuideProps) {
  const anchor =
    playerId === 1 ? PADDLE_ARM_ANCHOR.p1 : PADDLE_ARM_ANCHOR.p2
  const motion =
    playerId === 1 ? paddleMotionState.p1 : paddleMotionState.p2

  const anchorVec = useMemo(() => new THREE.Vector3(), [])
  const paddleVec = useMemo(() => new THREE.Vector3(), [])

  const getEndpoints = () => {
    anchorVec.set(anchor.x, ARM_LINE_Y, anchor.z)
    paddleVec.set(motion.x, ARM_LINE_Y, motion.z)
    return [anchorVec, paddleVec] as [THREE.Vector3, THREE.Vector3]
  }

  const getAnchorPos = () => {
    anchorVec.set(anchor.x, ARM_LINE_Y, anchor.z)
    return anchorVec
  }

  return (
    <group name={playerId === 1 ? 'ArmGuideP1' : 'ArmGuideP2'}>
      <ArmLine color={color} getEndpoints={getEndpoints} />
      <AnchorDot color={color} getPosition={getAnchorPos} />
    </group>
  )
}
