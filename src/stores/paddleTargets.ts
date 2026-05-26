import { PADDLE_SPAWN } from '../constants/paddle'

/** Alvo desejado (input) — a raquete converge com inércia. */
export const paddleTargets = {
  p1: { x: PADDLE_SPAWN.p1.x as number, z: PADDLE_SPAWN.p1.z as number },
  p2: { x: PADDLE_SPAWN.p2.x as number, z: PADDLE_SPAWN.p2.z as number },
}
