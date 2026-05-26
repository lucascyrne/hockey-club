import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  AIR_HOLE_CENTER_EXCLUSION_X,
  AIR_HOLE_CENTER_EXCLUSION_Z,
  AIR_HOLE_RADIUS,
  AIR_HOLE_SPACING,
  COLORS,
} from '../../constants/table'
import { PLAYFIELD_Y, TABLE_HD, TABLE_HW } from './tableVisualUtils'

const MARGIN = 0.06
const dummy = new THREE.Object3D()

function collectHolePositions(): [number, number][] {
  const out: [number, number][] = []
  for (let x = -TABLE_HW + MARGIN; x <= TABLE_HW - MARGIN; x += AIR_HOLE_SPACING) {
    for (let z = -TABLE_HD + MARGIN; z <= TABLE_HD - MARGIN; z += AIR_HOLE_SPACING) {
      if (
        Math.abs(x) < AIR_HOLE_CENTER_EXCLUSION_X &&
        Math.abs(z) < AIR_HOLE_CENTER_EXCLUSION_Z
      ) {
        continue
      }
      out.push([x, z])
    }
  }
  return out
}

export function TableAirHoles() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const positions = useMemo(() => collectHolePositions(), [])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    positions.forEach(([x, z], i) => {
      dummy.position.set(x, PLAYFIELD_Y + 0.0005, z)
      dummy.rotation.set(-Math.PI / 2, 0, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [positions])

  if (positions.length === 0) return null

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, positions.length]} renderOrder={0}>
      <circleGeometry args={[AIR_HOLE_RADIUS, 8]} />
      <meshStandardMaterial
        color={COLORS.airHole}
        emissive={COLORS.airHoleRim}
        emissiveIntensity={0.15}
        roughness={0.9}
        metalness={0.05}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
