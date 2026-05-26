import type { PlanarVelocity } from '../systems/paddleHit'

type VelocityGetter = () => PlanarVelocity

const registry = new Map<number, VelocityGetter>()

export function registerPaddleVelocity(playerId: number, getter: VelocityGetter) {
  registry.set(playerId, getter)
  return () => {
    registry.delete(playerId)
  }
}

export function getPaddleVelocity(playerId: number): PlanarVelocity {
  return registry.get(playerId)?.() ?? { x: 0, z: 0 }
}

export function parsePaddlePlayerId(name: string | undefined): number | null {
  if (name === 'PaddleP1') return 1
  if (name === 'PaddleP2') return 2
  return null
}
