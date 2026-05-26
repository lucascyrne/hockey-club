import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { THEME } from '../../theme/palette'
import { useArenaFxStore } from '../../stores/arenaFxStore'

type ArenaBackdropProps = {
  reactive?: boolean
}

export function ArenaBackdrop({ reactive = true }: ArenaBackdropProps) {
  const floorMat = useRef<THREE.MeshStandardMaterial>(null)
  const wallMat = useRef<THREE.MeshStandardMaterial>(null)

  const floorColor = useMemo(() => new THREE.Color(THEME.colors.backgroundAlt), [])
  const wallColor = useMemo(() => new THREE.Color(THEME.colors.background), [])

  useFrame((_, delta) => {
    if (reactive) useArenaFxStore.getState().tick(delta)

    const pulse = reactive ? useArenaFxStore.getState().pulse : 0
    const goal = reactive ? useArenaFxStore.getState().goalFlash : 0

    if (floorMat.current) {
      floorMat.current.emissiveIntensity = 0.04 + pulse * 0.2 + goal * 0.35
    }
    if (wallMat.current) {
      wallMat.current.emissiveIntensity = 0.06 + pulse * 0.25 + goal * 0.5
    }
  })

  return (
    <group name="ArenaBackdrop">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[14, 48]} />
        <meshStandardMaterial
          ref={floorMat}
          color={floorColor}
          emissive={THEME.colors.accentPurple}
          emissiveIntensity={0.04}
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      <mesh position={[0, 2.2, -5.5]} receiveShadow>
        <planeGeometry args={[18, 5]} />
        <meshStandardMaterial
          ref={wallMat}
          color={wallColor}
          emissive={THEME.colors.tableBorder}
          emissiveIntensity={0.06}
          roughness={0.9}
        />
      </mesh>

      <mesh position={[-7, 1.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial
          color={wallColor}
          emissive={THEME.colors.accentPurple}
          emissiveIntensity={0.05}
          roughness={0.92}
        />
      </mesh>

      <mesh position={[7, 1.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial
          color={wallColor}
          emissive={THEME.colors.tableNeonPink}
          emissiveIntensity={0.04}
          roughness={0.92}
        />
      </mesh>
    </group>
  )
}
