import { create } from 'zustand'
import type { PlayerId } from './gameStore'
import { useGameStore } from './gameStore'
import { cancelRoundCountdown } from '../systems/roundCountdown'
import { resetPaddlesToSpawn } from '../systems/resetRound'
import type { WinTarget } from '../../shared/protocol'
import { disconnectWs } from '../net/wsClient'
import { cleanupOnlineSession } from '../net/onlineHandlers'

export type SessionScreen = 'menu' | 'onlineLobby' | 'match'
export type MatchMode = 'vsCpu' | 'local2p' | 'online'

type SessionStore = {
  screen: SessionScreen
  matchMode: MatchMode
  localPlayerId: PlayerId
  hudDrawerOpen: boolean
  settingsOpen: boolean
  appHidden: boolean
  setHudDrawerOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setAppHidden: (hidden: boolean) => void
  enterMenu: () => void
  enterOnlineLobby: () => void
  startMatch: (mode: MatchMode) => void
  startOnlineMatch: (role: PlayerId, winTarget: WinTarget) => void
  exitMatch: () => void
  exitOnline: () => void
}

export const useSessionStore = create<SessionStore>((set) => ({
  screen: 'menu',
  matchMode: 'vsCpu',
  localPlayerId: 1,
  hudDrawerOpen: false,
  settingsOpen: false,
  appHidden: false,
  setHudDrawerOpen: (open) => set({ hudDrawerOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setAppHidden: (hidden) => set({ appHidden: hidden }),

  enterMenu: () => {
    cancelRoundCountdown()
    disconnectWs()
    cleanupOnlineSession()
    set({ screen: 'menu', hudDrawerOpen: false, settingsOpen: false })
  },

  enterOnlineLobby: () => {
    cancelRoundCountdown()
    cleanupOnlineSession()
    set({
      screen: 'onlineLobby',
      hudDrawerOpen: false,
      settingsOpen: false,
    })
  },

  startMatch: (mode) => {
    cancelRoundCountdown()
    useGameStore.getState().resetMatch()
    resetPaddlesToSpawn()
    set({
      screen: 'match',
      matchMode: mode,
      localPlayerId: 1,
      hudDrawerOpen: false,
      settingsOpen: false,
    })
  },

  startOnlineMatch: (role, winTarget) => {
    cancelRoundCountdown()
    useGameStore.getState().resetMatch()
    useGameStore.setState({ winTarget })
    resetPaddlesToSpawn()
    set({
      screen: 'match',
      matchMode: 'online',
      localPlayerId: role,
      hudDrawerOpen: false,
      settingsOpen: false,
    })
  },

  exitMatch: () => {
    cancelRoundCountdown()
    useGameStore.getState().resetMatch()
    resetPaddlesToSpawn()
    set({ screen: 'menu', hudDrawerOpen: false, settingsOpen: false })
  },

  exitOnline: () => {
    cancelRoundCountdown()
    disconnectWs()
    cleanupOnlineSession()
    useGameStore.getState().resetMatch()
    resetPaddlesToSpawn()
    set({
      screen: 'menu',
      matchMode: 'vsCpu',
      localPlayerId: 1,
      hudDrawerOpen: false,
      settingsOpen: false,
    })
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

export function isOnlineMode() {
  const { screen, matchMode } = useSessionStore.getState()
  return screen === 'match' && matchMode === 'online'
}

/** Partida local pausada com menu lateral ou configurações in-game abertos. */
export function isLocalMatchPaused() {
  const { screen, matchMode, hudDrawerOpen, settingsOpen, appHidden } =
    useSessionStore.getState()
  const phase = useGameStore.getState().phase
  return (
    screen === 'match' &&
    matchMode !== 'online' &&
    (appHidden || hudDrawerOpen || settingsOpen || phase === 'countdown')
  )
}

