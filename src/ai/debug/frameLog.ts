import type { ThreatTier } from '../prediction/threat'
import type { GoalThreatPath } from '../prediction/goalPath'
import type { CpuFsmState } from '../fsm/types'
import type { Vec2 } from '../types'

export type CpuDebugFrame = {
  timestamp: number
  playerId: 1 | 2
  state: CpuFsmState
  puckPosition: Vec2
  puckVelocity: Vec2
  predictedPath: GoalThreatPath | null
  threatLevel: number
  threatTier: ThreatTier
  chosenAction: string
  targetPosition: Vec2
  interceptPoint: Vec2 | null
  goalEntryZ: number | null
  ownGoalRisk: number
}

const MAX_FRAMES = 300
const buffer: CpuDebugFrame[] = []
let writeIndex = 0

export function pushCpuDebugFrame(frame: CpuDebugFrame) {
  if (buffer.length < MAX_FRAMES) {
    buffer.push(frame)
    writeIndex = buffer.length
    return
  }
  buffer[writeIndex % MAX_FRAMES] = frame
  writeIndex++
}

export function getCpuDebugFrames(): readonly CpuDebugFrame[] {
  if (buffer.length < MAX_FRAMES) return [...buffer]
  const start = writeIndex % MAX_FRAMES
  return [...buffer.slice(start), ...buffer.slice(0, start)]
}

export function getLatestCpuDebugFrame(): CpuDebugFrame | null {
  const frames = getCpuDebugFrames()
  return frames.length > 0 ? frames[frames.length - 1]! : null
}

export function clearCpuDebugLog() {
  buffer.length = 0
  writeIndex = 0
}
