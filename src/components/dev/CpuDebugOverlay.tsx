import { Html, Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { getLatestCpuDebugFrame } from '../../ai/debug/frameLog'
import { PUCK_REST_Y } from '../../constants/physics'
import { isCpuDebugLayer } from '../../stores/cpuDebugStore'

const Y = PUCK_REST_Y + 0.02

function PathLines({
  points,
  color,
}: {
  points: { x: number; z: number }[]
  color: string
}) {
  if (points.length < 2) return null
  const verts = points.map((p) => new THREE.Vector3(p.x, Y, p.z))
  return <Line points={verts} color={color} lineWidth={2} />
}

export function CpuDebugOverlay() {
  const [frame, setFrame] = useState(getLatestCpuDebugFrame)
  const lastUpdate = useRef(0)

  useFrame((state) => {
    if (!isCpuDebugLayer('predictions') && !isCpuDebugLayer('states')) return
    if (state.clock.elapsedTime - lastUpdate.current < 0.05) return
    lastUpdate.current = state.clock.elapsedTime
    setFrame(getLatestCpuDebugFrame())
  })

  if (!frame) return null

  const puck = frame.puckPosition
  const vel = frame.puckVelocity
  const path = frame.predictedPath

  const currentEnd = {
    x: puck.x + vel.x * 0.08,
    z: puck.z + vel.z * 0.08,
  }

  const goalLineX = path?.goalEntry?.x ?? -0.94
  const entryZ = frame.goalEntryZ ?? path?.goalEntry?.z ?? 0

  return (
    <group name="CpuDebugOverlay">
      {isCpuDebugLayer('predictions') && (
        <>
          <PathLines
            points={[puck, currentEnd]}
            color="#00f0ff"
          />
          {path && path.points.length > 1 && (
            <PathLines points={path.points} color="#ffe600" />
          )}
          {path &&
            path.points.length > 2 &&
            isCpuDebugLayer('goalThreats') && (
              <PathLines
                points={path.points.slice(1)}
                color="#ff8c00"
              />
            )}
        </>
      )}

      {isCpuDebugLayer('intercepts') && frame.interceptPoint && (
        <mesh position={[frame.interceptPoint.x, Y, frame.interceptPoint.z]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshBasicMaterial color="#00ff66" />
        </mesh>
      )}

      {isCpuDebugLayer('goalThreats') && frame.goalEntryZ !== null && (
        <Line
          points={[
            new THREE.Vector3(goalLineX, Y, -0.2),
            new THREE.Vector3(goalLineX, Y, entryZ),
            new THREE.Vector3(goalLineX, Y, 0.2),
          ]}
          color="#ff2244"
          lineWidth={3}
        />
      )}

      {isCpuDebugLayer('decisions') && (
        <mesh position={[frame.targetPosition.x, Y, frame.targetPosition.z]}>
          <boxGeometry args={[0.04, 0.01, 0.04]} />
          <meshBasicMaterial color="#00ff66" wireframe />
        </mesh>
      )}

      {isCpuDebugLayer('states') && (
        <Html
          position={[0, 1.2, 0]}
          center
          style={{
            pointerEvents: 'none',
            fontFamily: 'monospace',
            fontSize: 11,
            color: '#00f0ff',
            background: 'rgba(0,0,0,0.65)',
            padding: '4px 8px',
            whiteSpace: 'nowrap',
          }}
        >
          {`${frame.state} | ${frame.threatTier} ${(frame.threatLevel * 100).toFixed(0)}% | ${frame.chosenAction}`}
          {frame.ownGoalRisk > 0.3
            ? ` | OG risk ${(frame.ownGoalRisk * 100).toFixed(0)}%`
            : ''}
        </Html>
      )}
    </group>
  )
}
