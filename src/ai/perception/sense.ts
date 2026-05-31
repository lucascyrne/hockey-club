import { GOAL_HALF_WIDTH } from '../../constants/game'
import { TABLE_PLAY_HALF_X, TABLE_PLAY_HALF_Z } from '../../constants/physics'
import {
  getPaddlePlanarVelocity,
  getPaddlePosition,
} from '../../lib/paddlePositionRegistry'
import type { PuckSample } from '../../lib/puckTracker'
import { GOAL_LINE_X_NEG, GOAL_LINE_X_POS } from '../../systems/rules'
import type { PlayerId } from '../../systems/bounds'
import type { PerceptionSnapshot } from './types'

function opponentId(playerId: PlayerId): PlayerId {
  return playerId === 1 ? 2 : 1
}

function ownGoalLine(playerId: PlayerId) {
  return playerId === 2 ? GOAL_LINE_X_NEG : GOAL_LINE_X_POS
}

function enemyGoalLine(playerId: PlayerId) {
  return playerId === 2 ? GOAL_LINE_X_POS : GOAL_LINE_X_NEG
}

/** Build a perception snapshot from delayed puck + rendered paddle poses. */
export function buildPerceptionSnapshot(
  playerId: PlayerId,
  puck: PuckSample,
  now: number,
  lastPuckSampleAt: number,
): PerceptionSnapshot {
  const selfPos = getPaddlePosition(playerId)
  const selfVel = getPaddlePlanarVelocity(playerId)
  const oppId = opponentId(playerId)
  const oppPos = getPaddlePosition(oppId)
  const oppVel = getPaddlePlanarVelocity(oppId)

  const ageMs = Math.max(0, now - lastPuckSampleAt)

  return {
    timestamp: now,
    puck: {
      position: { x: puck.x, z: puck.z },
      velocity: { x: puck.vx, z: puck.vz },
      ageMs,
      confidence: 1,
    },
    self: {
      position: selfPos,
      velocity: selfVel,
      playerId,
      confidence: 1,
    },
    opponent: {
      position: oppPos,
      velocity: oppVel,
      playerId: oppId,
      confidence: 1,
    },
    ownGoal: { lineX: ownGoalLine(playerId), halfWidthZ: GOAL_HALF_WIDTH },
    enemyGoal: { lineX: enemyGoalLine(playerId), halfWidthZ: GOAL_HALF_WIDTH },
    walls: { halfX: TABLE_PLAY_HALF_X, halfZ: TABLE_PLAY_HALF_Z },
    puckSample: puck,
  }
}
