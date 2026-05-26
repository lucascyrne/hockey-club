import {
  CylinderCollider,
  RigidBody,
  useAfterPhysicsStep,
  type CollisionEnterPayload,
  type RapierRigidBody,
} from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { COLORS } from '../../constants/table'
import { THEME } from '../../theme/palette'
import {
  MAX_PUCK_SPEED,
  PUCK_HEIGHT,
  PUCK_MASS,
  PUCK_PHYSICS,
  PUCK_RADIUS,
  PUCK_SPAWN,
} from '../../constants/physics'
import { playHitPaddleSfx } from '../../audio/events'
import { getPaddleVelocity, parsePaddlePlayerId } from '../../lib/paddleRegistry'
import { setPuckSample } from '../../lib/puckTracker'
import { isMenuDemoActive } from '../../stores/menuDemoStore'
import { useGameStore } from '../../stores/gameStore'
import { useArenaFxStore } from '../../stores/arenaFxStore'
import {
  registerPuckActions,
  triggerFaceoff,
  unregisterPuckActions,
} from '../../stores/puckActions'
import { resolvePaddlePuckCollision } from '../../systems/paddleHit'
import { enforcePuckTableBounds } from '../../systems/puckBounds'
import { getLateralFaceoffSpawn, type PuckSpawnState } from '../../systems/puckSpawn'
import { restartCurrentMatch } from '../../systems/restartMatch'
import { detectGoal } from '../../systems/rules'

const MAX_Y_SPEED = 0.35
const PUCK_HALF_HEIGHT = PUCK_HEIGHT / 2
const HIT_COOLDOWN_MS = 70
const FLASH_DECAY = 8

function clampPuckVelocity(body: RapierRigidBody) {
  const linvel = body.linvel()
  const { x, y, z } = linvel
  let nx = x
  let ny = y
  let nz = z

  if (Math.abs(ny) > MAX_Y_SPEED) {
    ny = Math.sign(ny) * MAX_Y_SPEED
  }

  const speedXZ = Math.sqrt(nx * nx + nz * nz)
  const totalSpeed = Math.sqrt(nx * nx + ny * ny + nz * nz)

  if (totalSpeed > MAX_PUCK_SPEED) {
    const scale = MAX_PUCK_SPEED / totalSpeed
    nx *= scale
    ny *= scale
    nz *= scale
  } else if (speedXZ > MAX_PUCK_SPEED) {
    const scale = MAX_PUCK_SPEED / speedXZ
    nx *= scale
    nz *= scale
  }

  if (nx !== x || ny !== y || nz !== z) {
    body.setLinvel({ x: nx, y: ny, z: nz }, true)
  }
}

function applySpawn(body: RapierRigidBody, spawn: PuckSpawnState) {
  body.setTranslation({ x: spawn.x, y: spawn.y, z: spawn.z }, true)
  body.setLinvel({ x: spawn.vx, y: spawn.vy, z: spawn.vz }, true)
  body.setAngvel({ x: 0, y: 0, z: 0 }, true)
  body.wakeUp()
}

function PuckMesh({ flashRef }: { flashRef: RefObject<number> }) {
  const bodyMat = useRef<THREE.MeshStandardMaterial>(null)
  const rimMat = useRef<THREE.MeshStandardMaterial>(null)

  useFrame((_, dt) => {
    const flash = flashRef.current ?? 0
    if (flash > 0) {
      flashRef.current = Math.max(0, flash - dt * FLASH_DECAY)
    }
    const boost = (flashRef.current ?? 0) * 0.9
    if (bodyMat.current) {
      bodyMat.current.emissiveIntensity = 0.5 + boost
    }
    if (rimMat.current) {
      rimMat.current.emissiveIntensity = 0.85 + boost * 0.5
    }
  })

  return (
    <group name="PuckMesh">
      <mesh castShadow>
        <cylinderGeometry args={[PUCK_RADIUS, PUCK_RADIUS, PUCK_HEIGHT, 32]} />
        <meshStandardMaterial
          ref={bodyMat}
          color={COLORS.puck}
          emissive={COLORS.puckEmissive}
          emissiveIntensity={0.5}
          roughness={THEME.materials.puckRoughness}
          metalness={THEME.materials.puckMetalness}
        />
      </mesh>
      <mesh position={[0, PUCK_HALF_HEIGHT - 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[PUCK_RADIUS * 0.92, 0.0035, 12, 40]} />
        <meshStandardMaterial
          ref={rimMat}
          color={COLORS.puckRim}
          emissive={COLORS.puckEmissive}
          emissiveIntensity={0.85}
          roughness={0.08}
          metalness={0.45}
        />
      </mesh>
    </group>
  )
}

export function Puck() {
  const bodyRef = useRef<RapierRigidBody>(null)
  const lastHitAt = useRef(0)
  const meshFlash = useRef(0)

  useEffect(() => {
    registerPuckActions({
      faceoff: (spawn) => {
        const b = bodyRef.current
        if (b) applySpawn(b, spawn)
      },
      freeze: () => {
        const b = bodyRef.current
        if (!b) return
        b.setLinvel({ x: 0, y: 0, z: 0 }, true)
        b.setAngvel({ x: 0, y: 0, z: 0 }, true)
      },
    })

    const body = bodyRef.current
    if (body) {
      if (isMenuDemoActive()) {
        applySpawn(body, getLateralFaceoffSpawn())
      } else {
        applySpawn(body, {
          x: PUCK_SPAWN[0],
          y: PUCK_SPAWN[1],
          z: PUCK_SPAWN[2],
          vx: 0,
          vy: 0,
          vz: 0,
        })
      }
    }

    return () => unregisterPuckActions()
  }, [])

  const handleCollisionEnter = (payload: CollisionEnterPayload) => {
    if (useGameStore.getState().phase !== 'playing') return

    const now = performance.now()
    if (now - lastHitAt.current < HIT_COOLDOWN_MS) return

    const otherName = payload.other.rigidBodyObject?.name
    const playerId = parsePaddlePlayerId(otherName)
    if (playerId === null) return

    const body = bodyRef.current
    if (!body) return

    lastHitAt.current = now
    const t = body.translation()
    const other = payload.other.rigidBody
    if (!other) return

    const pt = other.translation()
    const paddleVel = getPaddleVelocity(playerId)
    resolvePaddlePuckCollision(body, t.x, t.z, pt.x, pt.z, paddleVel)

    const v = body.linvel()
    const relSpeed = Math.hypot(v.x - paddleVel.x, v.z - paddleVel.z)
    playHitPaddleSfx(Math.min(1, relSpeed / 8))
    const intensity = Math.min(1, relSpeed / 10)
    meshFlash.current = 1
    useArenaFxStore.getState().triggerImpact(intensity)
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isMenuDemoActive()) return

      if (e.code === 'KeyR') {
        restartCurrentMatch()
        return
      }

      if (useGameStore.getState().phase !== 'playing') return

      if (e.code === 'Space') {
        e.preventDefault()
        triggerFaceoff(getLateralFaceoffSpawn())
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useAfterPhysicsStep(() => {
    const body = bodyRef.current
    if (!body) return

    const phase = useGameStore.getState().phase

    const t = body.translation()
    const v = body.linvel()
    setPuckSample({ x: t.x, z: t.z, vx: v.x, vz: v.z })

    if (phase === 'playing') {
      const scorer = detectGoal(t.x, t.z)
      if (scorer !== null) {
        body.setLinvel({ x: 0, y: 0, z: 0 }, true)
        useGameStore.getState().onGoal(scorer)
        return
      }
      enforcePuckTableBounds(body)
      return
    }

    if (phase === 'goal' || phase === 'gameOver') {
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    }
  })

  useFrame(() => {
    const body = bodyRef.current
    if (!body || useGameStore.getState().phase !== 'playing') return
    clampPuckVelocity(body)
  })

  return (
    <RigidBody
      ref={bodyRef}
      name="Puck"
      type="dynamic"
      colliders={false}
      canSleep={false}
      ccd
      mass={PUCK_MASS}
      linearDamping={PUCK_PHYSICS.linearDamping}
      angularDamping={PUCK_PHYSICS.angularDamping}
      enabledRotations={[false, true, false]}
      onCollisionEnter={handleCollisionEnter}
    >
      <CylinderCollider
        args={[PUCK_HALF_HEIGHT, PUCK_RADIUS]}
        friction={PUCK_PHYSICS.friction}
        restitution={PUCK_PHYSICS.restitution}
      />
      <PuckMesh flashRef={meshFlash} />
    </RigidBody>
  )
}
