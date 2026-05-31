import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Group, Mesh } from 'three'
import { TABLE_DEPTH, TABLE_WIDTH } from '../../constants/table'
import { useLayoutStore } from '../../stores/layoutStore'
import { THEME } from '../../theme/palette'

const NEON_CYAN = '#00f0ff'
const NEON_PINK = THEME.colors.tableNeonPink
const NEON_VIOLET = THEME.colors.accentPurple

const TABLE_DIAG = Math.hypot(TABLE_WIDTH / 2, TABLE_DEPTH / 2)
const ELLIPSE_ALONG = 1.62
const ELLIPSE_ACROSS = 0.72

type RingSpec = {
  radius: number
  tube: number
  color: string
  spin: number
  phase: number
  wobbleHz: number
  wobbleAmp: number
  pulseHz: number
  scaleMulX: number
  scaleMulZ: number
}

const RINGS: RingSpec[] = [
  { radius: TABLE_DIAG + 0.72, tube: 0.038, color: NEON_CYAN, spin: 0.62, phase: 0, wobbleHz: 0.85, wobbleAmp: 0.14, pulseHz: 2.6, scaleMulX: 1, scaleMulZ: 1 },
  { radius: TABLE_DIAG + 1.28, tube: 0.032, color: NEON_PINK, spin: -0.48, phase: 1.4, wobbleHz: 0.65, wobbleAmp: 0.18, pulseHz: 2.1, scaleMulX: 1.04, scaleMulZ: 0.96 },
  { radius: TABLE_DIAG + 1.92, tube: 0.028, color: NEON_VIOLET, spin: 0.38, phase: 2.7, wobbleHz: 0.5, wobbleAmp: 0.22, pulseHz: 1.7, scaleMulX: 1.08, scaleMulZ: 0.92 },
  { radius: TABLE_DIAG + 2.62, tube: 0.024, color: NEON_CYAN, spin: -0.32, phase: 4.1, wobbleHz: 0.42, wobbleAmp: 0.26, pulseHz: 1.4, scaleMulX: 1.12, scaleMulZ: 0.88 },
  { radius: TABLE_DIAG + 3.38, tube: 0.02, color: NEON_PINK, spin: 0.26, phase: 5.5, wobbleHz: 0.35, wobbleAmp: 0.3, pulseHz: 1.1, scaleMulX: 1.16, scaleMulZ: 0.84 },
]

function ringEllipse(portrait: boolean) {
  return portrait
    ? { x: ELLIPSE_ACROSS, z: ELLIPSE_ALONG }
    : { x: ELLIPSE_ALONG, z: ELLIPSE_ACROSS }
}

function NeonRing({
  spec,
  scaleX,
  scaleZ,
  segments,
}: {
  spec: RingSpec
  scaleX: number
  scaleZ: number
  segments: [number, number]
}) {
  const groupRef = useRef<Group>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(({ clock }) => {
    const g = groupRef.current
    const mat = matRef.current
    if (!g) return

    const t = clock.elapsedTime + spec.phase
    const breathe = 1 + Math.sin(t * 1.35) * 0.055
    const tilt = Math.sin(t * spec.wobbleHz) * spec.wobbleAmp
    const roll = Math.cos(t * spec.wobbleHz * 0.73) * spec.wobbleAmp * 0.45

    g.rotation.set(Math.PI / 2 + tilt, spec.spin * t, roll)
    g.scale.set(scaleX * spec.scaleMulX * breathe, breathe, scaleZ * spec.scaleMulZ * breathe)
    g.position.y = 0.1 + Math.sin(t * 1.05) * 0.035

    if (mat) {
      const pulse = 0.5 + 0.5 * Math.sin(t * spec.pulseHz)
      mat.opacity = 0.55 + pulse * 0.45
    }
  })

  return (
    <group ref={groupRef}>
      <mesh renderOrder={1}>
        <torusGeometry args={[spec.radius, spec.tube, segments[0], segments[1]]} />
        <meshBasicMaterial
          ref={matRef}
          color={spec.color}
          toneMapped={false}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export function LandingNeonRings() {
  const width = useLayoutStore((s) => s.width)
  const height = useLayoutStore((s) => s.height)
  const reduceMenuFx = useLayoutStore((s) => s.reduceMenuFx)
  const portrait = height > width
  const ellipse = useMemo(() => ringEllipse(portrait), [portrait])
  const rings = useMemo(
    () => (reduceMenuFx ? RINGS.slice(0, 3) : RINGS),
    [reduceMenuFx],
  )
  const segments = useMemo<[number, number]>(
    () => (reduceMenuFx ? [28, 72] : [40, 128]),
    [reduceMenuFx],
  )
  const fieldRef = useRef<Group>(null)
  const haloRef = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    if (fieldRef.current) {
      fieldRef.current.rotation.y = Math.sin(t * 0.12) * 0.18 + t * 0.04
      fieldRef.current.rotation.x = Math.sin(t * 0.08) * 0.04
    }

    if (haloRef.current) {
      const s = 1 + Math.sin(t * 0.9) * 0.03
      haloRef.current.scale.set(ellipse.x * 3.6 * s, 1, ellipse.z * 3.6 * s)
      const mat = haloRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.08 + (0.5 + 0.5 * Math.sin(t * 1.3)) * 0.06
    }
  })

  return (
    <group ref={fieldRef} name="LandingNeonRings">
      <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]} renderOrder={0}>
        <torusGeometry args={[TABLE_DIAG + 0.5, 0.06, 28, 72]} />
        <meshBasicMaterial
          color={NEON_CYAN}
          toneMapped={false}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {rings.map((spec, i) => (
        <NeonRing
          key={i}
          spec={spec}
          scaleX={ellipse.x}
          scaleZ={ellipse.z}
          segments={segments}
        />
      ))}
    </group>
  )
}
