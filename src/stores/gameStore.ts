import { create } from 'zustand'
import { DEMO_WIN_TARGET } from '../constants/game'
import { DEFAULT_WIN_TARGET } from '../lib/cpuDifficulty'
import { isMenuDemoActive } from './menuDemoStore'
import { usePuckFlowStore } from './puckFlowStore'
import { useSettingsStore } from './settingsStore'

export type GamePhase = 'countdown' | 'playing' | 'goal' | 'gameOver'
export type PlayerId = 1 | 2

type GameStore = {
  phase: GamePhase
  scoreP1: number
  scoreP2: number
  winner: PlayerId | null
  winTarget: number
  lastGoalBy: PlayerId | null
  onGoal: (scorer: PlayerId) => void
  enterCountdown: () => void
  resetMatch: () => void
  resumePlaying: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'playing',
  scoreP1: 0,
  scoreP2: 0,
  winner: null,
  winTarget: DEFAULT_WIN_TARGET,
  lastGoalBy: null,

  onGoal: (scorer) => {
    const state = get()
    if (state.phase !== 'playing') return

    if (isMenuDemoActive()) {
      set({ lastGoalBy: scorer })
      return
    }

    const scoreP1 = state.scoreP1 + (scorer === 1 ? 1 : 0)
    const scoreP2 = state.scoreP2 + (scorer === 2 ? 1 : 0)
    const winner =
      scoreP1 >= state.winTarget ? 1 : scoreP2 >= state.winTarget ? 2 : null

    if (winner) {
      set({
        phase: 'gameOver',
        scoreP1,
        scoreP2,
        winner,
        lastGoalBy: scorer,
      })
      return
    }

    set({
      phase: 'goal',
      scoreP1,
      scoreP2,
      lastGoalBy: scorer,
    })
  },

  enterCountdown: () => set({ phase: 'countdown' }),

  resetMatch: () => {
    usePuckFlowStore.getState().resetFlow()
    const winTarget = isMenuDemoActive()
      ? DEMO_WIN_TARGET
      : useSettingsStore.getState().winTarget
    set({
      phase: 'playing',
      scoreP1: 0,
      scoreP2: 0,
      winner: null,
      lastGoalBy: null,
      winTarget,
    })
  },

  resumePlaying: () => {
    if (isMenuDemoActive() && get().phase === 'gameOver') return
    set({ phase: 'playing' })
  },
}))
