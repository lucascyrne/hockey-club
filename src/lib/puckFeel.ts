import { MAX_PUCK_SPEED, PUCK_PHYSICS } from '../constants/physics'

const AIR_DAMPING_MIN = 0.44
const AIR_DAMPING_MAX = PUCK_PHYSICS.linearDamping
const AIR_SPEED_MIN = MAX_PUCK_SPEED * 0.25
const AIR_SPEED_MAX = MAX_PUCK_SPEED

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function getPuckLinearDamping(airLevel: number) {
  return lerp(AIR_DAMPING_MIN, AIR_DAMPING_MAX, clamp01(airLevel))
}

export function getMaxPuckSpeed(airLevel: number) {
  return lerp(AIR_SPEED_MIN, AIR_SPEED_MAX, clamp01(airLevel))
}

export function getPuckFriction(airLevel: number) {
  return lerp(PUCK_PHYSICS.friction + 0.02, PUCK_PHYSICS.friction, clamp01(airLevel))
}
