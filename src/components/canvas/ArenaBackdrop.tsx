import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { MeshStandardMaterial } from 'three'
import { THEME } from '../../theme/palette'
import { useGameLayout } from '../../hooks/useGameLayout'
import { arenaEmissive } from '../../lib/arenaPulse'
import { useArenaFxStore } from '../../stores/arenaFxStore'
import { useSessionStore } from '../../stores/sessionStore'

type ArenaBackdropProps = {
  reactive?: boolean
}

export function ArenaBackdrop({ reactive = true }: ArenaBackdropProps) {
  const is2p = useSessionStore((s) => s.matchMode === 'local2p')
  const { isMobile } = useGameLayout()
  const mobileVsCpu = isMobile && !is2p

  const floorMat = useRef<MeshStandardMaterial>(null)
  const wallMat = useRef<MeshStandardMaterial>(null)
  const sideLeftMat = useRef<MeshStandardMaterial>(null)
  const sideRightMat = useRef<MeshStandardMaterial>(null)

  const floorColor = useMemo(() => new THREE.Color(THEME.colors.backgroundAlt), [])
  const wallColor = useMemo(() => new THREE.Color(THEME.colors.background), [])

  const floorRadius = is2p ? 22 : mobileVsCpu ? 20 : 14
  const backWall = is2p
    ? { w: 28, h: 12, z: -9 }
    : mobileVsCpu
      ? { w: 24, h: 10, z: -7 }
      : { w: 18, h: 5, z: -5.5 }
  const sideWall = is2p ? { w: 14, h: 8 } : mobileVsCpu ? { w: 12, h: 7 } : { w: 10, h: 4 }
  const sideX = is2p ? 10 : mobileVsCpu ? 9 : 7

  useFrame((_, delta) => {
    if (reactive) useArenaFxStore.getState().tick(delta)

    const pulse = reactive ? useArenaFxStore.getState().pulse : 0
    const goal = reactive ? useArenaFxStore.getState().goalFlash : 0

    if (floorMat.current) {
      floorMat.current.emissiveIntensity = arenaEmissive(0.04, pulse, goal, 0.2, 0.35)
    }
    if (wallMat.current) {
      wallMat.current.emissiveIntensity = arenaEmissive(0.06, pulse, goal, 0.25, 0.5)
    }
    if (sideLeftMat.current) {
      sideLeftMat.current.emissiveIntensity = arenaEmissive(0.05, pulse, goal, 0.22, 0.4)
    }
    if (sideRightMat.current) {
      sideRightMat.current.emissiveIntensity = arenaEmissive(0.04, pulse, goal, 0.22, 0.4)
    }
  })

  return (
    <group name="ArenaBackdrop">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[floorRadius, 48]} />
        <meshStandardMaterial
          ref={floorMat}
          color={floorColor}
          emissive={THEME.colors.accentPurple}
          emissiveIntensity={0.04}
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      <mesh position={[0, 2.2, backWall.z]} receiveShadow>
        <planeGeometry args={[backWall.w, backWall.h]} />
        <meshStandardMaterial
          ref={wallMat}
          color={wallColor}
          emissive={THEME.colors.tableBorder}
          emissiveIntensity={0.06}
          roughness={0.9}
        />
      </mesh>

      <mesh position={[-sideX, 1.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[sideWall.w, sideWall.h]} />
        <meshStandardMaterial
          ref={sideLeftMat}
          color={wallColor}
          emissive={THEME.colors.accentPurple}
          emissiveIntensity={0.05}
          roughness={0.92}
        />
      </mesh>

      <mesh position={[sideX, 1.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[sideWall.w, sideWall.h]} />
        <meshStandardMaterial
          ref={sideRightMat}
          color={wallColor}
          emissive={THEME.colors.tableNeonPink}
          emissiveIntensity={0.04}
          roughness={0.92}
        />
      </mesh>
    </group>
  )
}
