export type PuckSample = {
  x: number
  z: number
  vx: number
  vz: number
}

const state: PuckSample = { x: 0, z: 0, vx: 0, vz: 0 }

export function setPuckSample(sample: PuckSample) {
  state.x = sample.x
  state.z = sample.z
  state.vx = sample.vx
  state.vz = sample.vz
}

export function getPuckSample(): PuckSample {
  return state
}
