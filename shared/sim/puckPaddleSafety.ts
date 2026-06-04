import { resolvePuckPaddleOverlaps, type PaddleOverlap } from './puckContact.js'
import { snapPuckToTablePlane } from './puckBounds.js'
import type { PlanarBody } from './types.js'

export type { PaddleOverlap } from './puckContact.js'

export function runPuckPaddleSafety(
  body: PlanarBody,
  paddles: PaddleOverlap[],
) {
  const pos = body.translation()
  resolvePuckPaddleOverlaps(body, pos.x, pos.z, paddles)
  snapPuckToTablePlane(body)
}
