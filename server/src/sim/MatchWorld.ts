import type { RigidBody } from '@dimforge/rapier3d-compat'
import { RAPIER } from './rapierInit.js'
import type { PlayerId } from '../../../shared/sim/bounds.js'
import {
  clampPuckSpeed,
  enforcePuckTableBounds,
  snapPuckToTablePlane,
} from '../../../shared/sim/puckBounds.js'
import { resolvePaddlePuckCollisionVel } from '../../../shared/sim/paddleHit.js'
import { runPuckPaddleSafety } from '../../../shared/sim/puckPaddleSafety.js'
import {
  MAX_PUCK_SPEED,
  PUCK_PHYSICS,
  PUCK_RADIUS,
  PUCK_REST_Y,
  TABLE_COLLIDERS,
  WALL_PHYSICS,
} from '../../../shared/sim/physicsConstants.js'
import {
  PADDLE_HALF_HEIGHT,
  PADDLE_PHYSICS,
  PADDLE_RADIUS,
  PADDLE_SPAWN,
  PADDLE_Y,
} from '../../../shared/sim/paddleConstants.js'

const COLLISION_EVENTS = RAPIER.ActiveEvents.COLLISION_EVENTS

export class MatchWorld {
  readonly world: RAPIER.World
  readonly eventQueue: RAPIER.EventQueue
  readonly puck: RigidBody
  readonly paddles: Record<PlayerId, RigidBody>
  private paddleHandles = new Map<number, PlayerId>()

  constructor() {
    this.world = new RAPIER.World({ x: 0, y: 0, z: 0 })
    this.eventQueue = new RAPIER.EventQueue(true)

    const table = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed())
    for (const c of TABLE_COLLIDERS) {
      const desc = RAPIER.ColliderDesc.cuboid(c.args[0], c.args[1], c.args[2])
        .setTranslation(c.position[0], c.position[1], c.position[2])
        .setFriction(WALL_PHYSICS.friction)
        .setRestitution(WALL_PHYSICS.restitution)
      if (c.rotation) {
        desc.setRotation({
          w: Math.cos(c.rotation[1] / 2),
          x: 0,
          y: Math.sin(c.rotation[1] / 2),
          z: 0,
        })
      }
      this.world.createCollider(desc, table)
    }

    const puckBody = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(0, PUCK_REST_Y, 0)
        .setLinearDamping(PUCK_PHYSICS.linearDamping)
        .setAngularDamping(PUCK_PHYSICS.angularDamping)
        .setCcdEnabled(true),
    )
    this.world.createCollider(
      RAPIER.ColliderDesc.ball(PUCK_RADIUS)
        .setFriction(PUCK_PHYSICS.friction)
        .setRestitution(PUCK_PHYSICS.restitution)
        .setActiveEvents(COLLISION_EVENTS),
      puckBody,
    )
    this.puck = puckBody

    this.paddles = { 1: this.createPaddle(1), 2: this.createPaddle(2) }
  }

  private createPaddle(playerId: PlayerId) {
    const spawn = playerId === 1 ? PADDLE_SPAWN.p1 : PADDLE_SPAWN.p2
    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased()
        .setTranslation(spawn.x, PADDLE_Y, spawn.z)
        .setCcdEnabled(true),
    )
    const collider = this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(PADDLE_RADIUS, PADDLE_HALF_HEIGHT, PADDLE_RADIUS)
        .setFriction(PADDLE_PHYSICS.friction)
        .setRestitution(PADDLE_PHYSICS.restitution)
        .setActiveEvents(COLLISION_EVENTS),
      body,
    )
    this.paddleHandles.set(collider.handle, playerId)
    return body
  }

  setPaddlePosition(playerId: PlayerId, x: number, z: number) {
    const body = this.paddles[playerId]
    body.setNextKinematicTranslation({ x, y: PADDLE_Y, z })
  }

  setPuckSpawn(x: number, z: number, vx: number, vz: number) {
    this.puck.setTranslation({ x, y: PUCK_REST_Y, z }, true)
    this.puck.setLinvel({ x: vx, y: 0, z: vz }, true)
    this.puck.wakeUp()
  }

  freezePuck() {
    this.puck.setLinvel({ x: 0, y: 0, z: 0 }, true)
  }

  step(dt: number, paddleVel: Record<PlayerId, { vx: number; vz: number }>) {
    this.world.step(this.eventQueue)

    this.eventQueue.drainCollisionEvents((h1, h2, started) => {
      if (!started) return

      const p1 = this.paddleHandles.get(h1)
      const p2 = this.paddleHandles.get(h2)
      const playerId = p1 ?? p2
      if (!playerId) return
      if (p1 && p2) return

      const pt = this.puck.translation()
      const paddle = this.paddles[playerId]
      const pp = paddle.translation()
      const pv = paddleVel[playerId]
      resolvePaddlePuckCollisionVel(
        this.puck,
        pt.x,
        pt.z,
        pp.x,
        pp.z,
        pv.vx,
        pv.vz,
        playerId === 1 ? 1 : -1,
      )
    })

    const pt = this.puck.translation()
    const p1 = this.paddles[1].translation()
    const p2 = this.paddles[2].translation()
    runPuckPaddleSafety(this.puck, [
      {
        x: p1.x,
        z: p1.z,
        vel: paddleVel[1],
        awayX: 1,
        clearTowardEnemyX: -1,
      },
      {
        x: p2.x,
        z: p2.z,
        vel: paddleVel[2],
        awayX: -1,
        clearTowardEnemyX: 1,
      },
    ])

    snapPuckToTablePlane(this.puck)
    enforcePuckTableBounds(this.puck)
    clampPuckSpeed(this.puck, MAX_PUCK_SPEED)
  }

  getPuckSnapshot() {
    const t = this.puck.translation()
    const v = this.puck.linvel()
    return { x: t.x, z: t.z, vx: v.x, vz: v.z }
  }

  dispose() {
    this.world.free()
    this.eventQueue.free()
  }
}
