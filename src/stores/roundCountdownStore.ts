import { create } from 'zustand'

export type CountdownStep = 1 | 2 | 3 | 'puck'

type RoundCountdownStore = {
  step: CountdownStep | null
  setStep: (step: CountdownStep | null) => void
}

export const useRoundCountdownStore = create<RoundCountdownStore>((set) => ({
  step: null,
  setStep: (step) => set({ step }),
}))
