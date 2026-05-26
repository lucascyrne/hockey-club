import { create } from 'zustand'
import type { PlayerId } from './gameStore'
import { useGameStore } from './gameStore'
import { resetPaddlesToSpawn } from '../systems/resetRound'

export type SessionScreen = 'menu' | 'match'
export type MatchMode = 'vsCpu' | 'local2p' | 'online'

type SessionStore = {
  screen: SessionScreen
  matchMode: MatchMode
  localPlayerId: PlayerId
  enterMenu: () => void
  startMatch: (mode: MatchMode) => void
  exitMatch: () => void
}

export const useSessionStore = create<SessionStore>((set) => ({
  screen: 'menu',
  matchMode: 'vsCpu',
  localPlayerId: 1,

  enterMenu: () => {
    set({ screen: 'menu' })
  },

  startMatch: (mode) => {
    useGameStore.getState().resetMatch()
    resetPaddlesToSpawn()
    set({
      screen: 'match',
      matchMode: mode,
      localPlayerId: 1,
    })
  },

  exitMatch: () => {
    useGameStore.getState().resetMatch()
    resetPaddlesToSpawn()
    set({ screen: 'menu' })
  },
}))

export function isVsCpuMode() {
  const { screen, matchMode } = useSessionStore.getState()
  return screen === 'match' && matchMode === 'vsCpu'
}

export function isLocal2pMode() {
  const { screen, matchMode } = useSessionStore.getState()
  return screen === 'match' && matchMode === 'local2p'
}
