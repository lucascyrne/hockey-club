import { create } from 'zustand'
import type { PlayerId } from './gameStore'

export type PuckFlow = 'play' | 'inChute' | 'ejecting' | 'held'

type Vec3 = { x: number; y: number; z: number }

type PuckFlowState = {
  flow: PuckFlow
  scorer: PlayerId | null
  chuteStartMs: number
  chuteFrom: Vec3
  chuteTo: Vec3
  startChute: (scorer: PlayerId, from: Vec3, to: Vec3) => void
  startEject: () => void
  holdForFaceoff: () => void
  resetFlow: () => void
}

const defaultVec = { x: 0, y: 0, z: 0 }

export const usePuckFlowStore = create<PuckFlowState>((set) => ({
  flow: 'play',
  scorer: null,
  chuteStartMs: 0,
  chuteFrom: defaultVec,
  chuteTo: defaultVec,

  startChute: (scorer, from, to) => {
    set({
      flow: 'inChute',
      scorer,
      chuteStartMs: performance.now(),
      chuteFrom: from,
      chuteTo: to,
    })
  },

  startEject: () => set({ flow: 'ejecting' }),

  holdForFaceoff: () => set({ flow: 'held', scorer: null }),

  resetFlow: () =>
    set({
      flow: 'play',
      scorer: null,
      chuteStartMs: 0,
      chuteFrom: defaultVec,
      chuteTo: defaultVec,
    }),
}))
