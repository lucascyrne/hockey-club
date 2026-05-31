import type { PlanarVelocity, Vec2 } from '../types'
import type { PlayerId } from '../../systems/bounds'
import type { PuckSample } from '../../lib/puckTracker'

export type PuckObservation = {
  position: Vec2
  velocity: PlanarVelocity
  /** Age of this sample since last physics update (ms). */
  ageMs: number
  confidence: number
}

export type MalletObservation = {
  position: Vec2
  velocity: PlanarVelocity
  playerId: PlayerId
  confidence: number
}

export type GoalBounds = {
  lineX: number
  halfWidthZ: number
}

export type TableBounds = {
  halfX: number
  halfZ: number
}

export type PerceptionSnapshot = {
  timestamp: number
  puck: PuckObservation
  self: MalletObservation
  opponent?: MalletObservation
  ownGoal: GoalBounds
  enemyGoal: GoalBounds
  walls: TableBounds
  /** Raw delayed puck sample used by legacy helpers. */
  puckSample: PuckSample
}
