import {
  CuboidCollider,
  RigidBody,
  useBeforePhysicsStep,
  type RapierRigidBody,
} from '@react-three/rapier'
import { useEffect, useRef } from 'react'
import { netPaddle } from '../../lib/onlineNetState'
import { isOnlineMode, useSessionStore } from '../../stores/sessionStore'
import {
  PADDLE_HALF_HEIGHT,
  PADDLE_HEIGHT,
  PADDLE_PHYSICS,
  PADDLE_RADIUS,
  PADDLE_Y,
} from '../../constants/paddle'
import { THEME } from '../../theme/palette'
import { registerPaddleVelocity } from '../../lib/paddleRegistry'
import { registerPaddlePose } from '../../lib/paddlePositionRegistry'
import { stepPaddleMotion } from '../../lib/paddleMotion'
import { PaddleVelocityTracker } from '../../lib/paddleVelocityTracker'
import type { PlayerId } from '../../systems/bounds'
import { usePuckFlowStore } from '../../stores/puckFlowStore'
import { paddleMotionState } from '../../stores/paddleMotionState'
import { paddleTargets } from '../../stores/paddleTargets'

type PaddleProps = {
  playerId: PlayerId
  color: string
  emissive: string
  spawn: { x: number; z: number }
}

const HEAD_Y_SCALE = 0.55
const HEAD_HALF_H = PADDLE_HALF_HEIGHT * HEAD_Y_SCALE
const HANDLE_LEN = 0.055
const HANDLE_RADIUS = 0.011

function PaddleMesh({
  color,
  emissive,
  playerId,
}: {
  color: string
  emissive: string
  playerId: PlayerId
}) {
  const handleX = playerId === 1 ? 0.022 : -0.022
  const handleY = HEAD_HALF_H + HANDLE_LEN / 2 + 0.003

  return (
    <group name="PaddleMesh">
      <mesh castShadow scale={[1, HEAD_Y_SCALE, 1]}>
        <cylinderGeometry args={[PADDLE_RADIUS, PADDLE_RADIUS, PADDLE_HEIGHT, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.55}
          roughness={THEME.materials.paddleRoughness}
          metalness={THEME.materials.paddleMetalness}
        />
      </mesh>
      <mesh position={[0, HEAD_HALF_H, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[PADDLE_RADIUS * 0.95, 0.004, 12, 40]} />
        <meshStandardMaterial
          color={THEME.colors.paddleRim}
          emissive={emissive}
          emissiveIntensity={0.7}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>
      <mesh position={[handleX, handleY, 0]} castShadow>
        <cylinderGeometry args={[HANDLE_RADIUS, HANDLE_RADIUS * 1.1, HANDLE_LEN, 10]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.25}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
    </group>
  )
}

export function Paddle({ playerId, color, emissive, spawn }: PaddleProps) {
  const bodyRef = useRef<RapierRigidBody>(null)
  const tracker = useRef(new PaddleVelocityTracker())
  const target = playerId === 1 ? paddleTargets.p1 : paddleTargets.p2
  const motion = playerId === 1 ? paddleMotionState.p1 : paddleMotionState.p2
  const bodyName = playerId === 1 ? 'PaddleP1' : 'PaddleP2'

  useEffect(() => {
    motion.x = spawn.x
    motion.z = spawn.z
    motion.vx = 0
    motion.vz = 0
    target.x = spawn.x
    target.z = spawn.z
    tracker.current.reset(spawn.x, spawn.z)

    const body = bodyRef.current
    if (body) {
      body.setTranslation({ x: spawn.x, y: PADDLE_Y, z: spawn.z }, true)
    }

    registerPaddlePose(playerId, { x: spawn.x, z: spawn.z, vx: 0, vz: 0 })

    return registerPaddleVelocity(playerId, () => tracker.current.getVelocity())
  }, [playerId, spawn.x, spawn.z])

  useBeforePhysicsStep((world) => {
    const body = bodyRef.current
    if (!body) return

    const dt = world.timestep > 0 ? world.timestep : 1 / 60

    if (isOnlineMode()) {
      const localId = useSessionStore.getState().localPlayerId
      const isLocal = playerId === localId

      if (isLocal) {
        stepPaddleMotion(motion, target.x, target.z, playerId, dt)
      } else {
        const pose = playerId === 1 ? netPaddle.p1 : netPaddle.p2
        motion.x = pose.x
        motion.z = pose.z
      }
    } else {
      stepPaddleMotion(motion, target.x, target.z, playerId, dt)
    }

    body.setNextKinematicTranslation({
      x: motion.x,
      y: PADDLE_Y,
      z: motion.z,
    })
    tracker.current.record(motion.x, motion.z)
    const vel = tracker.current.getVelocity()
    registerPaddlePose(playerId, {
      x: motion.x,
      z: motion.z,
      vx: vel.x,
      vz: vel.z,
    })
  })

  const flow = usePuckFlowStore((s) => s.flow)
  const paddleSensor = isOnlineMode() && flow === 'play'

  return (
    <RigidBody
      ref={bodyRef}
      name={bodyName}
      type="kinematicPosition"
      colliders={false}
      ccd
      enabledRotations={[false, true, false]}
    >
      <CuboidCollider
        args={[PADDLE_RADIUS, PADDLE_HALF_HEIGHT, PADDLE_RADIUS]}
        friction={PADDLE_PHYSICS.friction}
        restitution={PADDLE_PHYSICS.restitution}
        sensor={paddleSensor}
      />
      <PaddleMesh color={color} emissive={emissive} playerId={playerId} />
    </RigidBody>
  )
}
