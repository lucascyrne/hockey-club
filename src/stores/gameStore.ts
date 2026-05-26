import { create } from 'zustand'
import { DEMO_GOAL_PAUSE_MS, GOAL_PAUSE_MS, WIN_TARGET } from '../constants/game'
import { isMenuDemoActive } from './menuDemoStore'

export type GamePhase = 'playing' | 'goal' | 'gameOver'
export type PlayerId = 1 | 2

type GameStore = {
  phase: GamePhase
  scoreP1: number
  scoreP2: number
  winner: PlayerId | null
  winTarget: number
  lastGoalBy: PlayerId | null
  onGoal: (scorer: PlayerId) => void
  resetMatch: () => void
  resumePlaying: () => void
}

let goalTimeoutId: ReturnType<typeof setTimeout> | null = null

function clearGoalTimeout() {
  if (goalTimeoutId !== null) {
    clearTimeout(goalTimeoutId)
    goalTimeoutId = null
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'playing',
  scoreP1: 0,
  scoreP2: 0,
  winner: null,
  winTarget: WIN_TARGET,
  lastGoalBy: null,

  onGoal: (scorer) => {
    const state = get()
    if (state.phase !== 'playing') return

    if (isMenuDemoActive()) {
      set({ phase: 'goal', lastGoalBy: scorer })
      clearGoalTimeout()
      goalTimeoutId = setTimeout(() => {
        goalTimeoutId = null
        const current = get()
        if (current.phase === 'goal' && isMenuDemoActive()) {
          set({ phase: 'playing' })
        }
      }, DEMO_GOAL_PAUSE_MS)
      return
    }

    const scoreP1 = state.scoreP1 + (scorer === 1 ? 1 : 0)
    const scoreP2 = state.scoreP2 + (scorer === 2 ? 1 : 0)
    const winner =
      scoreP1 >= state.winTarget ? 1 : scoreP2 >= state.winTarget ? 2 : null

    set({
      phase: winner ? 'gameOver' : 'goal',
      scoreP1,
      scoreP2,
      winner,
      lastGoalBy: scorer,
    })

    clearGoalTimeout()
    goalTimeoutId = setTimeout(() => {
      goalTimeoutId = null
      const current = get()
      if (current.phase === 'goal') {
        set({ phase: 'playing' })
      }
    }, GOAL_PAUSE_MS)
  },

  resetMatch: () => {
    clearGoalTimeout()
    set({
      phase: 'playing',
      scoreP1: 0,
      scoreP2: 0,
      winner: null,
      lastGoalBy: null,
    })
  },

  resumePlaying: () => {
    set({ phase: 'playing' })
  },
}))
