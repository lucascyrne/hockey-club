import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { Mesh } from 'three'
import {
  TABLE_BORDER_HEIGHT,
  TABLE_BORDER_THICKNESS,
  TABLE_DEPTH,
  TABLE_SURFACE_THICKNESS,
  TABLE_WIDTH,
  COLORS,
} from '../../constants/table'
import { GOAL_HALF_WIDTH } from '../../constants/game'
import { useArenaFxStore } from '../../stores/arenaFxStore'
import { TableAirHoles } from './TableAirHoles'
import { TableLogo } from './TableLogo'
import {
  cornerMarkRotationZ,
  PLAYFIELD_Y,
  TABLE_HD,
  TABLE_HW,
} from './tableVisualUtils'

const SURFACE_Y = TABLE_SURFACE_THICKNESS / 2
const BORDER_Y = TABLE_BORDER_HEIGHT / 2 + TABLE_SURFACE_THICKNESS

/** Corpo da mesa + plano de jogo brilhante. */
function TableBody() {
  const playfieldRef = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const mesh = playfieldRef.current
    if (!mesh) return
    const mat = mesh.material as THREE.MeshStandardMaterial
    if (!mat.emissiveIntensity) return
    mat.emissiveIntensity = 0.12 + Math.sin(clock.elapsedTime * 0.8) * 0.04
  })

  return (
    <>
      <mesh position={[0, SURFACE_Y - 0.008, 0]} receiveShadow>
        <boxGeometry args={[TABLE_WIDTH + 0.04, 0.02, TABLE_DEPTH + 0.04]} />
        <meshStandardMaterial
          color={COLORS.tableUnderbody}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      <mesh position={[0, SURFACE_Y, 0]} receiveShadow castShadow>
        <boxGeometry args={[TABLE_WIDTH, TABLE_SURFACE_THICKNESS, TABLE_DEPTH]} />
        <meshStandardMaterial
          color={COLORS.tableSurface}
          emissive={COLORS.tableSurfaceEmissive}
          emissiveIntensity={0.16}
          roughness={0.4}
          metalness={0.12}
        />
      </mesh>
      <mesh
        ref={playfieldRef}
        position={[0, PLAYFIELD_Y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[TABLE_WIDTH * 0.98, TABLE_DEPTH * 0.98, 48, 24]} />
        <meshStandardMaterial
          color={COLORS.tableSurfaceGloss}
          emissive={COLORS.tableBorder}
          emissiveIntensity={0.14}
          roughness={0.12}
          metalness={0.35}
          transparent
          opacity={0.32}
        />
      </mesh>
    </>
  )
}

/** Linhas e detalhes neon no plano de jogo. */
function TableMarkings() {
  const y = PLAYFIELD_Y + 0.0004

  return (
    <group name="TableMarkings">
      <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.014, TABLE_DEPTH * 0.94]} />
        <meshStandardMaterial
          color={COLORS.tableBorder}
          emissive={COLORS.tableBorder}
          emissiveIntensity={0.7}
          transparent
          opacity={0.85}
        />
      </mesh>

      <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.11, 0.125, 48]} />
        <meshStandardMaterial
          color={COLORS.tableBorder}
          emissive={COLORS.tableBorder}
          emissiveIntensity={0.45}
          transparent
          opacity={0.55}
        />
      </mesh>

      {([-1, 1] as const).flatMap((sx) =>
        ([-1, 1] as const).map((sz) => (
          <mesh
            key={`corner-${sx}-${sz}`}
            position={[sx * (TABLE_HW - 0.14), y, sz * (TABLE_HD - 0.08)]}
            rotation={[-Math.PI / 2, 0, cornerMarkRotationZ(sx, sz)]}
          >
            <ringGeometry args={[0.04, 0.052, 24, 1, 0, Math.PI / 2]} />
            <meshStandardMaterial
              color={COLORS.tableNeonPink}
              emissive={COLORS.tableNeonPink}
              emissiveIntensity={0.5}
              transparent
              opacity={0.65}
            />
          </mesh>
        )),
      )}

      {[-0.55, 0.55].map((x) => (
        <mesh
          key={`hash-${x}`}
          position={[x, y, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.35, 0.008]} />
          <meshStandardMaterial
            color={COLORS.tableBorder}
            emissive={COLORS.tableBorder}
            emissiveIntensity={0.35}
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}
    </group>
  )
}

/** Faixa LED animada ao longo da borda superior da parede. */
function RailLedStrip({
  position,
  size,
}: {
  position: [number, number, number]
  size: [number, number]
}) {
  const ref = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const mesh = ref.current
    if (!mesh) return
    const mat = mesh.material as THREE.MeshStandardMaterial
    const pulse = useArenaFxStore.getState().pulse
    const goal = useArenaFxStore.getState().goalFlash
    mat.emissiveIntensity =
      0.55 + Math.sin(clock.elapsedTime * 2.2) * 0.18 + pulse * 0.45 + goal * 0.35
  })

  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[size[0], 0.012, size[1]]} />
      <meshStandardMaterial
        color={COLORS.tableBorder}
        emissive={COLORS.tableBorder}
        emissiveIntensity={0.6}
        roughness={0.15}
        metalness={0.2}
        toneMapped={false}
      />
    </mesh>
  )
}

function EndRailSegment({
  signX,
  signZ,
}: {
  signX: number
  signZ: number
}) {
  const endSegHalfZ = (TABLE_HD - GOAL_HALF_WIDTH) / 2
  const endSegCenterZ = GOAL_HALF_WIDTH + endSegHalfZ
  const bt = TABLE_BORDER_THICKNESS
  const bh = TABLE_BORDER_HEIGHT
  const x = signX * (TABLE_HW + bt / 2)

  return (
    <mesh position={[x, BORDER_Y, signZ * endSegCenterZ]} castShadow receiveShadow>
      <boxGeometry args={[bt, bh, endSegHalfZ * 2]} />
      <meshStandardMaterial
        color={COLORS.tableBorderDark}
        emissive={COLORS.tableBorder}
        emissiveIntensity={0.28}
        roughness={0.3}
        metalness={0.15}
      />
    </mesh>
  )
}

/** Bordas elevadas estilo air hockey real: base + cap arredondado + LED. */
function TableRails() {
  const bt = TABLE_BORDER_THICKNESS
  const bh = TABLE_BORDER_HEIGHT
  const capY = BORDER_Y + bh / 2 - 0.008
  const ledY = BORDER_Y + bh / 2 + 0.002

  const sideRail = (zSign: number) => (
    <group key={zSign}>
      <mesh position={[0, BORDER_Y, zSign * (TABLE_HD + bt / 2)]} castShadow receiveShadow>
        <boxGeometry args={[TABLE_WIDTH + bt * 2, bh, bt]} />
        <meshStandardMaterial
          color={COLORS.tableBorderDark}
          emissive={COLORS.tableBorder}
          emissiveIntensity={0.32}
          roughness={0.28}
          metalness={0.12}
        />
      </mesh>
      <mesh position={[0, capY, zSign * (TABLE_HD + bt / 2 + 0.004)]}>
        <boxGeometry args={[TABLE_WIDTH + bt * 2.2, 0.018, bt + 0.01]} />
        <meshStandardMaterial
          color={COLORS.tableRailCap}
          emissive={COLORS.tableBorder}
          emissiveIntensity={0.55}
          roughness={0.18}
          metalness={0.25}
        />
      </mesh>
      <RailLedStrip
        position={[0, ledY, zSign * (TABLE_HD + bt / 2)]}
        size={[TABLE_WIDTH + bt * 1.6, 0.006]}
      />
    </group>
  )

  return (
    <group name="TableRails">
      <EndRailSegment signX={-1} signZ={-1} />
      <EndRailSegment signX={-1} signZ={1} />
      <EndRailSegment signX={1} signZ={-1} />
      <EndRailSegment signX={1} signZ={1} />
      {sideRail(-1)}
      {sideRail(1)}

      {[
        [-TABLE_HW - bt / 2, TABLE_HD],
        [-TABLE_HW - bt / 2, -TABLE_HD],
        [TABLE_HW + bt / 2, TABLE_HD],
        [TABLE_HW + bt / 2, -TABLE_HD],
      ].map(([x, z], i) => (
        <mesh key={`post-${i}`} position={[x, BORDER_Y + bh * 0.15, z]}>
          <cylinderGeometry args={[0.028, 0.032, bh * 0.35, 12]} />
          <meshStandardMaterial
            color={COLORS.tableRailCap}
            emissive={COLORS.tableBorder}
            emissiveIntensity={0.5}
            metalness={0.3}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}

/** Ondulação muito subtil no vértices do plano de brilho. */
function TableSurfaceWaves() {
  const geomRef = useRef<THREE.PlaneGeometry>(null)
  const baseZ = useRef<Float32Array | null>(null)

  useFrame(({ clock }) => {
    const geom = geomRef.current
    if (!geom) return
    const pos = geom.attributes.position
    if (!baseZ.current || baseZ.current.length !== pos.count) {
      baseZ.current = new Float32Array(pos.count)
      for (let i = 0; i < pos.count; i++) {
        baseZ.current[i] = pos.getZ(i)
      }
    }
    const t = clock.elapsedTime
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const wave =
        Math.sin(x * 14 + t * 1.1) * 0.00035 +
        Math.cos(y * 11 + t * 0.9) * 0.00028
      pos.setZ(i, baseZ.current[i] + wave)
    }
    pos.needsUpdate = true
  })

  return (
    <mesh position={[0, PLAYFIELD_Y + 0.0002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry ref={geomRef} args={[TABLE_WIDTH * 0.96, TABLE_DEPTH * 0.96, 48, 24]} />
      <meshStandardMaterial
        color={COLORS.tableSurface}
        emissive={COLORS.tableSurfaceEmissive}
        emissiveIntensity={0.08}
        roughness={0.55}
        metalness={0.08}
        transparent
        opacity={0.25}
        depthWrite={false}
      />
    </mesh>
  )
}

/** Painel vertical tipo arcade cabinet sob a borda. */
function TableSkirt() {
  const skirtH = 0.05
  const y = -skirtH / 2 + 0.002
  return (
    <group name="TableSkirt">
      <mesh position={[0, y, TABLE_HD + 0.06]}>
        <boxGeometry args={[TABLE_WIDTH + 0.12, skirtH, 0.02]} />
        <meshStandardMaterial
          color={COLORS.tableUnderbody}
          emissive={COLORS.accentPurple}
          emissiveIntensity={0.08}
          roughness={0.85}
        />
      </mesh>
      <mesh position={[0, y - 0.012, TABLE_HD + 0.072]}>
        <boxGeometry args={[TABLE_WIDTH + 0.08, 0.008, 0.006]} />
        <meshStandardMaterial
          color={COLORS.tableBorder}
          emissive={COLORS.tableBorder}
          emissiveIntensity={0.5}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

/** Aberturas visuais de gol nas pontas ±X (sem collider). */
function TableGoalMouths() {
  const y = PLAYFIELD_Y + 0.001
  const depth = 0.06
  return (
    <group name="TableGoalMouths">
      {([-1, 1] as const).map((sx) => (
        <mesh
          key={sx}
          position={[sx * (TABLE_HW + 0.02), y, 0]}
          rotation={[-Math.PI / 2, 0, sx > 0 ? 0 : Math.PI]}
        >
          <planeGeometry args={[depth, GOAL_HALF_WIDTH * 2]} />
          <meshStandardMaterial
            color="#020810"
            emissive={COLORS.goalFlash}
            emissiveIntensity={0.15}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  )
}

export function Table() {
  return (
    <group name="Table">
      <TableBody />
      <TableSkirt />
      <TableSurfaceWaves />
      <TableAirHoles />
      <TableMarkings />
      <TableGoalMouths />
      <TableRails />
      <TableLogo />
    </group>
  )
}
