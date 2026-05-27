import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { TABLE_SURFACE_TOP } from '../../constants/physics'
import { TABLE_WIDTH } from '../../constants/table'
import type { PlayerId } from '../../systems/bounds'

const LOGO_URLS = ['/textures/hockey-club-logo.webp', '/textures/hockey-club-logo.png']
const LOGO_WIDTH = TABLE_WIDTH * 0.28
const LOGO_OPACITY = 0.48
const LOGO_Y = TABLE_SURFACE_TOP + 0.003
const HALF_CENTER_X = TABLE_WIDTH / 4

const BASE_ROTATION: [number, number, number] = [-Math.PI / 2, 0, Math.PI / 2]

export function loadLogoTexture(): Promise<THREE.Texture | null> {
  const loader = new THREE.TextureLoader()
  return new Promise((resolve) => {
    let i = 0
    const tryNext = () => {
      if (i >= LOGO_URLS.length) {
        resolve(null)
        return
      }
      loader.load(
        LOGO_URLS[i],
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace
          tex.anisotropy = 4
          resolve(tex)
        },
        undefined,
        () => {
          i += 1
          tryNext()
        },
      )
    }
    tryNext()
  })
}

function logoRotation(facePlayerId: PlayerId): [number, number, number] {
  if (facePlayerId === 1) return BASE_ROTATION
  return [-Math.PI / 2, 0, -Math.PI / 2]
}

function TableLogoDecal({
  texture,
  centerX,
  facePlayerId,
}: {
  texture: THREE.Texture
  centerX: number
  facePlayerId: PlayerId
}) {
  const aspect = texture.image
    ? (texture.image as HTMLImageElement).width /
      (texture.image as HTMLImageElement).height
    : 1
  const logoHeight = LOGO_WIDTH / aspect

  return (
    <mesh
      position={[centerX, LOGO_Y, 0]}
      rotation={logoRotation(facePlayerId)}
      renderOrder={2}
    >
      <planeGeometry args={[LOGO_WIDTH, logoHeight]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={LOGO_OPACITY}
        color="#88e8ff"
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

export function TableLogo() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let cancelled = false
    loadLogoTexture().then((tex) => {
      if (!cancelled) setTexture(tex)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!texture) return null

  return (
    <group name="TableLogos">
      <TableLogoDecal texture={texture} centerX={HALF_CENTER_X} facePlayerId={1} />
      <TableLogoDecal texture={texture} centerX={-HALF_CENTER_X} facePlayerId={2} />
    </group>
  )
}
