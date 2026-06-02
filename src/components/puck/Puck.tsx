import {
  CylinderCollider,
  RigidBody,
  useAfterPhysicsStep,
  useBeforePhysicsStep,
  type CollisionEnterPayload,
  type RapierRigidBody,
} from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'
import { COLORS } from '../../constants/table'
import { THEME } from '../../theme/palette'
import {
  DEMO_PUCK_CHUTE_MS,
  PUCK_CHUTE_MS,
} from '../../constants/game'
import {
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
import { usePuckFlowStore } from '../../stores/puckFlowStore'
import { useArenaFxStore } from '../../stores/arenaFxStore'
import {
  registerPuckActions,
  triggerFaceoff,
  unregisterPuckActions,
} from '../../stores/puckActions'
import { getCpuStrikeStrength } from '../../ai/actuation/strikeProfile'
import { resolvePaddlePuckCollision } from '../../systems/paddleHit'
import { enforcePuckTableBounds } from '../../systems/puckBounds'
import { runPuckPaddleSafety } from '../../systems/puckPaddleSafety'
import { snapPuckToTablePlane } from '../../systems/puckBounds'
import {
  computeChuteTarget,
  lerpChutePosition,
} from '../../systems/puckGoalSequence'
import { beginRoundCountdown } from '../../systems/roundCountdown'
import { getLateralFaceoffSpawn, type PuckSpawnState } from '../../systems/puckSpawn'
import { resetPaddlesToSpawn } from '../../systems/resetRound'
import { restartCurrentMatch } from '../../systems/restartMatch'
import { detectGoal } from '../../systems/rules'
import { getCpuProfile } from '../../lib/cpuDifficulty'
import { getMaxPuckSpeed, getPuckLinearDamping } from '../../lib/puckFeel'
import { useSettingsStore } from '../../stores/settingsStore'
import { isOnlineMode } from '../../stores/sessionStore'
import { netPuck } from '../../lib/onlineNetState'

const PUCK_HALF_HEIGHT = PUCK_HEIGHT / 2
const HIT_COOLDOWN_MS = 70
const FLASH_DECAY = 8

function clampPuckVelocity(body: RapierRigidBody, maxSpeed: number) {
  const linvel = body.linvel()
  const { x, y, z } = linvel
  let nx = x
  let ny = y
  let nz = z

  if (ny !== 0) ny = 0

  const speedXZ = Math.sqrt(nx * nx + nz * nz)
  const totalSpeed = Math.sqrt(nx * nx + ny * ny + nz * nz)

  if (totalSpeed > maxSpeed) {
    const scale = maxSpeed / totalSpeed
    nx *= scale
    ny *= scale
    nz *= scale
  } else if (speedXZ > maxSpeed) {
    const scale = maxSpeed / speedXZ
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

function PuckMesh({
  flashRef,
  visible,
}: {
  flashRef: RefObject<number>
  visible: boolean
}) {
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
    <group name="PuckMesh" visible={visible}>
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
  const [meshVisible, setMeshVisible] = useState(true)

  const chuteMs = () => (isMenuDemoActive() ? DEMO_PUCK_CHUTE_MS : PUCK_CHUTE_MS)

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
      nudge: (vx, vz) => {
        const b = bodyRef.current
        if (!b) return
        b.setLinvel({ x: vx, y: 0, z: vz }, true)
        b.wakeUp()
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
    if (isOnlineMode()) return
    const phase = useGameStore.getState().phase
    if (usePuckFlowStore.getState().flow !== 'play' || phase !== 'playing') return

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
    const baseHit =
      playerId === 2
        ? getCpuProfile(useSettingsStore.getState().cpuDifficulty).hitStrength
        : 1
    const hitStrength = playerId === 2 ? getCpuStrikeStrength(baseHit) : baseHit
    resolvePaddlePuckCollision(
      body,
      t.x,
      t.z,
      pt.x,
      pt.z,
      paddleVel,
      playerId === 1 ? 1 : -1,
      hitStrength,
      playerId === 1 ? -1 : 1,
    )

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

      if (useGameStore.getState().phase === 'gameOver') return

      if (e.code === 'Space' && useGameStore.getState().phase === 'playing') {
        e.preventDefault()
        beginRoundCountdown()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useBeforePhysicsStep(() => {
    const body = bodyRef.current
    if (!body) return

    if (isOnlineMode()) {
      const s = netPuck.current
      body.setNextKinematicTranslation({
        x: s.x,
        y: PUCK_SPAWN[1],
        z: s.z,
      })
      body.setLinvel({ x: s.vx, y: 0, z: s.vz }, true)
      setPuckSample(s)
      return
    }

    const phase = useGameStore.getState().phase
    const flow = usePuckFlowStore.getState().flow
    if (phase === 'playing' && flow === 'play') {
      runPuckPaddleSafety(body)
    }
  })

  useAfterPhysicsStep(() => {
    const body = bodyRef.current
    if (!body) return

    if (isOnlineMode()) return

    const phase = useGameStore.getState().phase
    const flow = usePuckFlowStore.getState().flow

    if (phase === 'gameOver') {
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      return
    }

    if (flow === 'inChute') {
      const { chuteStartMs, chuteFrom, chuteTo } = usePuckFlowStore.getState()
      const elapsed = performance.now() - chuteStartMs
      const t = elapsed / chuteMs()

      if (t >= 1) {
        const pos = chuteTo
        body.setTranslation(pos, true)
        body.setLinvel({ x: 0, y: 0, z: 0 }, true)
        setMeshVisible(true)
        usePuckFlowStore.getState().resetFlow()
        beginRoundCountdown()
        return
      }

      const pos = lerpChutePosition(chuteFrom, chuteTo, t)
      body.setTranslation(pos, true)
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      setMeshVisible(t < 0.35)
      setPuckSample({ x: pos.x, z: pos.z, vx: 0, vz: 0 })
      return
    }

    if (flow === 'held') {
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      const pos = body.translation()
      setPuckSample({ x: pos.x, z: pos.z, vx: 0, vz: 0 })
      setMeshVisible(true)
      return
    }

    const t = body.translation()
    const v = body.linvel()
    setPuckSample({ x: t.x, z: t.z, vx: v.x, vz: v.z })

    if (flow === 'play') {
      enforcePuckTableBounds(body)
      snapPuckToTablePlane(body)
    }

    if (phase === 'playing') {
      const pos = body.translation()
      const scorer = detectGoal(pos.x, pos.z)
      if (scorer !== null) {
        useGameStore.getState().onGoal(scorer)
        if (isMenuDemoActive()) {
          usePuckFlowStore.getState().resetFlow()
          useGameStore.getState().resumePlaying()
          resetPaddlesToSpawn()
          triggerFaceoff(getLateralFaceoffSpawn())
          return
        }
        if (isOnlineMode()) return
        if (useGameStore.getState().phase === 'gameOver') return
        const { from, to } = computeChuteTarget(scorer, pos.x, pos.y, pos.z)
        usePuckFlowStore.getState().startChute(scorer, from, to)
        return
      }

      if (flow === 'play') {
        runPuckPaddleSafety(body)
      }
    }
  })

  const online = isOnlineMode()
  const flow = usePuckFlowStore((s) => s.flow)

  useFrame(() => {
    if (online) return

    const body = bodyRef.current
    if (!body) return

    const airLevel = useSettingsStore.getState().airLevel
    body.setLinearDamping(getPuckLinearDamping(airLevel))

    const phase = useGameStore.getState().phase
    const puckFlow = usePuckFlowStore.getState().flow
    if (phase === 'gameOver' || puckFlow !== 'play') return

    clampPuckVelocity(body, getMaxPuckSpeed(airLevel))
  })

  const colliderSensor = online || flow !== 'play'

  return (
    <RigidBody
      ref={bodyRef}
      name="Puck"
      type={online ? 'kinematicPosition' : 'dynamic'}
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
        sensor={colliderSensor}
      />
      <PuckMesh flashRef={meshFlash} visible={meshVisible} />
    </RigidBody>
  )
}
