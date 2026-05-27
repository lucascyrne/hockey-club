import { create } from 'zustand'
import type { NetPlayerId, WinTarget } from '../../shared/protocol'

export type OnlineConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'lobby'
  | 'playing'
  | 'error'
  | 'disconnected'

type OnlineStore = {
  status: OnlineConnectionStatus
  roomCode: string | null
  role: NetPlayerId | null
  peerJoined: boolean
  errorCode: string | null
  disconnectMessage: boolean
  winTarget: WinTarget | null
  setStatus: (status: OnlineConnectionStatus) => void
  setRoom: (code: string, role: NetPlayerId) => void
  setPeerJoined: (joined: boolean) => void
  setError: (code: string | null) => void
  setDisconnectMessage: (show: boolean) => void
  setWinTarget: (winTarget: WinTarget | null) => void
  reset: () => void
}

const initial = {
  status: 'idle' as OnlineConnectionStatus,
  roomCode: null,
  role: null,
  peerJoined: false,
  errorCode: null,
  disconnectMessage: false,
  winTarget: null,
}

export const useOnlineStore = create<OnlineStore>((set) => ({
  ...initial,
  setStatus: (status) => set({ status }),
  setRoom: (code, role) =>
    set({ roomCode: code, role, status: 'lobby', errorCode: null }),
  setPeerJoined: (peerJoined) => set({ peerJoined }),
  setError: (errorCode) =>
    set((s) => ({
      errorCode,
      status: errorCode ? 'error' : s.status === 'error' ? 'lobby' : s.status,
    })),
  setDisconnectMessage: (disconnectMessage) => set({ disconnectMessage }),
  setWinTarget: (winTarget) => set({ winTarget }),
  reset: () => set({ ...initial }),
}))
