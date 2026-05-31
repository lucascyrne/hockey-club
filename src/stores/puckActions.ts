import { playFaceoffSfx } from '../audio/events'
import type { PuckSpawnState } from '../systems/puckSpawn'

type PuckActions = {
  faceoff: (spawn: PuckSpawnState) => void
  freeze: () => void
  nudge: (vx: number, vz: number) => void
}

let actions: PuckActions | null = null

export function registerPuckActions(next: PuckActions) {
  actions = next
}

export function unregisterPuckActions() {
  actions = null
}

export function stageFaceoffHold(spawn: PuckSpawnState) {
  actions?.faceoff({ ...spawn, vx: 0, vy: 0, vz: 0 })
}

export function triggerFaceoff(spawn: PuckSpawnState) {
  actions?.faceoff(spawn)
  playFaceoffSfx()
}

export function freezePuck() {
  actions?.freeze()
}

export function nudgePuck(vx: number, vz: number) {
  actions?.nudge(vx, vz)
}
