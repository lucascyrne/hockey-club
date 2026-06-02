import RAPIER from '@dimforge/rapier3d-compat'

let ready = false

export async function initRapier() {
  if (ready) return
  await RAPIER.init()
  ready = true
}

export { RAPIER }
