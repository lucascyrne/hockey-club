import type { NetGamePhase, NetPuckFlow, NetPlayerId, SnapshotPayload, WinTarget } from '../../../shared/protocol.js'
import type { PlayerId } from '../../../shared/sim/bounds.js'
import { createPlanarMotion, stepPaddleMotion, type PlanarMotion } from '../../../shared/sim/paddleMotion.js'
import {
  GOAL_SFX_MS,
  ROUND_COUNTDOWN_PUCK_MS,
  ROUND_COUNTDOWN_STEP_MS,
} from '../../../shared/sim/gameConstants.js'
import { PADDLE_SPAWN } from '../../../shared/sim/paddleConstants.js'
import { PHYSICS_TIMESTEP } from '../../../shared/sim/physicsConstants.js'
import { getLateralFaceoffSpawn } from '../../../shared/sim/puckSpawn.js'
import { detectGoal } from '../../../shared/sim/rules.js'
import { MatchWorld } from './MatchWorld.js'

type CountdownStep = 1 | 2 | 3 | 'puck' | null

export class MatchSession {
  readonly winTarget: WinTarget
  private world: MatchWorld
  private tick = 0
  private serverStart = Date.now()
  private phase: NetGamePhase = 'countdown'
  private flow: NetPuckFlow = 'held'
  private scores: [number, number] = [0, 0]
  private countdownStep: CountdownStep = null
  private flowElapsed = 0
  private countdownElapsed = 0
  private goalEvent: NetPlayerId | null = null
  private readonly motion: Record<PlayerId, PlanarMotion> = {
    1: createPlanarMotion(PADDLE_SPAWN.p1.x, PADDLE_SPAWN.p1.z),
    2: createPlanarMotion(PADDLE_SPAWN.p2.x, PADDLE_SPAWN.p2.z),
  }
  private readonly targets: Record<PlayerId, { px: number; pz: number }> = {
    1: { ...PADDLE_SPAWN.p1 },
    2: { ...PADDLE_SPAWN.p2 },
  }

  constructor(winTarget: WinTarget) {
    this.winTarget = winTarget
    this.world = new MatchWorld()
    this.beginCountdown()
  }

  getPhase(): NetGamePhase {
    return this.phase
  }

  setInput(playerId: PlayerId, px: number, pz: number) {
    this.targets[playerId].px = px
    this.targets[playerId].pz = pz
  }

  private beginCountdown() {
    this.phase = 'countdown'
    this.flow = 'held'
    this.countdownElapsed = 0
    this.countdownStep = null
    this.flowElapsed = 0
    const spawn = getLateralFaceoffSpawn()
    this.world.setPuckSpawn(spawn.x, spawn.z, 0, 0)
    this.world.freezePuck()
  }

  private startPlayingFromFaceoff() {
    this.phase = 'playing'
    this.flow = 'play'
    this.countdownStep = null
    const spawn = getLateralFaceoffSpawn()
    this.world.setPuckSpawn(spawn.x, spawn.z, spawn.vx, spawn.vz)
  }

  private onGoal(scorer: PlayerId) {
    this.goalEvent = scorer
    this.scores = [
      this.scores[0] + (scorer === 1 ? 1 : 0),
      this.scores[1] + (scorer === 2 ? 1 : 0),
    ]
    if (this.scores[0] >= this.winTarget || this.scores[1] >= this.winTarget) {
      this.phase = 'gameOver'
      this.flow = 'held'
      this.world.freezePuck()
      return
    }
    this.phase = 'goal'
    this.flow = 'inChute'
    this.flowElapsed = 0
    this.world.freezePuck()
  }

  advance(): SnapshotPayload {
    const dt = PHYSICS_TIMESTEP
    this.tick += 1

    if (this.phase === 'countdown') {
      this.countdownElapsed += dt * 1000
      const t = this.countdownElapsed
      if (t < ROUND_COUNTDOWN_STEP_MS) this.countdownStep = 3
      else if (t < ROUND_COUNTDOWN_STEP_MS * 2) this.countdownStep = 2
      else if (t < ROUND_COUNTDOWN_STEP_MS * 3) this.countdownStep = 1
      else if (t < ROUND_COUNTDOWN_STEP_MS * 3 + ROUND_COUNTDOWN_PUCK_MS) {
        this.countdownStep = 'puck'
      } else {
        this.startPlayingFromFaceoff()
      }
    } else if (this.phase === 'goal' && this.flow === 'inChute') {
      this.flowElapsed += dt * 1000
      if (this.flowElapsed >= GOAL_SFX_MS) {
        this.beginCountdown()
      }
    } else if (this.phase === 'playing' && this.flow === 'play') {
      const paddleVel: Record<PlayerId, { vx: number; vz: number }> = {
        1: { vx: 0, vz: 0 },
        2: { vx: 0, vz: 0 },
      }
      for (const id of [1, 2] as const) {
        stepPaddleMotion(
          this.motion[id],
          this.targets[id].px,
          this.targets[id].pz,
          id,
          dt,
        )
        this.world.setPaddlePosition(id, this.motion[id].x, this.motion[id].z)
        paddleVel[id] = { vx: this.motion[id].vx, vz: this.motion[id].vz }
      }
      this.world.step(dt, paddleVel)
      const puck = this.world.getPuckSnapshot()
      const scorer = detectGoal(puck.x, puck.z)
      if (scorer !== null) this.onGoal(scorer)
    } else if (this.flow === 'held') {
      this.world.freezePuck()
    }

    return this.buildSnapshot()
  }

  private buildSnapshot(): SnapshotPayload {
    return {
      serverTime: Date.now() - this.serverStart,
      tick: this.tick,
      puck: this.world.getPuckSnapshot(),
      p1: { x: this.motion[1].x, z: this.motion[1].z },
      p2: { x: this.motion[2].x, z: this.motion[2].z },
      phase: this.phase,
      scores: [...this.scores],
      countdownStep: this.countdownStep,
      flow: this.flow,
    }
  }

  consumeGoalEvent(): NetPlayerId | null {
    const g = this.goalEvent
    this.goalEvent = null
    return g
  }

  dispose() {
    this.world.dispose()
  }
}
