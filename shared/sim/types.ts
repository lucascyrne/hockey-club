export type { PlayerId } from './bounds.js'

export type PlanarVelocity = { x: number; z: number }

export type PlanarBody = {
  translation(): { x: number; y: number; z: number }
  linvel(): { x: number; y: number; z: number }
  setTranslation(t: { x: number; y: number; z: number }, wake: boolean): void
  setLinvel(v: { x: number; y: number; z: number }, wake: boolean): void
  wakeUp(): void
}

export type PuckSample = { x: number; z: number; vx: number; vz: number }
