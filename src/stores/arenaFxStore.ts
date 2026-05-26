import { create } from 'zustand'

type ArenaFxStore = {
  pulse: number
  goalFlash: number
  triggerImpact: (intensity?: number) => void
  triggerGoal: () => void
  tick: (dt: number) => void
}

const PULSE_DECAY = 4.5
const GOAL_DECAY = 2.2

export const useArenaFxStore = create<ArenaFxStore>((set, get) => ({
  pulse: 0,
  goalFlash: 0,

  triggerImpact: (intensity = 0.55) => {
    set((s) => ({ pulse: Math.min(1, Math.max(s.pulse, intensity)) }))
  },

  triggerGoal: () => {
    set({ goalFlash: 1, pulse: Math.max(get().pulse, 0.35) })
  },

  tick: (dt) => {
    const { pulse, goalFlash } = get()
    if (pulse <= 0 && goalFlash <= 0) return
    set({
      pulse: Math.max(0, pulse - dt * PULSE_DECAY),
      goalFlash: Math.max(0, goalFlash - dt * GOAL_DECAY),
    })
  },
}))

export function getArenaPulse() {
  return useArenaFxStore.getState().pulse
}

export function getArenaGoalFlash() {
  return useArenaFxStore.getState().goalFlash
}
