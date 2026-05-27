import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAudioVolumes, type AudioVolumes } from '../audio/audioEngine'
import {
  DEFAULT_CAMERA_PREFS,
  type UserCameraPrefs,
} from '../constants/camera'
import {
  DEFAULT_WIN_TARGET,
  normalizeCpuDifficulty,
  normalizeWinTarget,
  type CpuDifficulty,
  type WinTarget,
} from '../lib/cpuDifficulty'
import type { PlayerId } from './gameStore'

type SettingsStore = AudioVolumes & {
  airLevel: number
  winTarget: WinTarget
  cpuDifficulty: CpuDifficulty
  cameraP1: UserCameraPrefs
  cameraP2: UserCameraPrefs
  paddleSpeedP1: number
  paddleSpeedP2: number
  setMasterVolume: (v: number) => void
  setSfxVolume: (v: number) => void
  setBgmVolume: (v: number) => void
  setMuted: (muted: boolean) => void
  toggleMuted: () => void
  setAirLevel: (v: number) => void
  setCamera: (playerId: PlayerId, partial: Partial<UserCameraPrefs>) => void
  resetCamera: (playerId?: PlayerId) => void
  setPaddleSpeed: (playerId: PlayerId, v: number) => void
  setWinTarget: (v: WinTarget) => void
  setCpuDifficulty: (v: CpuDifficulty) => void
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function applyToEngine(state: AudioVolumes) {
  setAudioVolumes(state)
}

type LegacyPersisted = {
  camera?: UserCameraPrefs
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      masterVolume: 1,
      sfxVolume: 1,
      bgmVolume: 0.7,
      muted: false,
      airLevel: 1,
      winTarget: DEFAULT_WIN_TARGET,
      cpuDifficulty: 3,
      cameraP1: { ...DEFAULT_CAMERA_PREFS },
      cameraP2: { ...DEFAULT_CAMERA_PREFS },
      paddleSpeedP1: 1,
      paddleSpeedP2: 1,

      setMasterVolume: (v) => {
        const masterVolume = clamp01(v)
        const { sfxVolume, bgmVolume, muted } = get()
        set({ masterVolume })
        applyToEngine({ masterVolume, sfxVolume, bgmVolume, muted })
      },

      setSfxVolume: (v) => {
        const sfxVolume = clamp01(v)
        const { masterVolume, bgmVolume, muted } = get()
        set({ sfxVolume })
        applyToEngine({ masterVolume, sfxVolume, bgmVolume, muted })
      },

      setBgmVolume: (v) => {
        const bgmVolume = clamp01(v)
        const { masterVolume, sfxVolume, muted } = get()
        set({ bgmVolume })
        applyToEngine({ masterVolume, sfxVolume, bgmVolume, muted })
      },

      setMuted: (muted) => {
        const { masterVolume, sfxVolume, bgmVolume } = get()
        set({ muted })
        applyToEngine({ masterVolume, sfxVolume, bgmVolume, muted })
      },

      toggleMuted: () => {
        const { masterVolume, sfxVolume, bgmVolume, muted } = get()
        const nextMuted = !muted
        set({ muted: nextMuted })
        applyToEngine({ masterVolume, sfxVolume, bgmVolume, muted: nextMuted })
      },

      setAirLevel: (v) => set({ airLevel: clamp01(v) }),

      setCamera: (playerId, partial) => {
        const state = get()
        if (playerId === 1) {
          set({ cameraP1: { ...state.cameraP1, ...partial } })
        } else {
          set({ cameraP2: { ...state.cameraP2, ...partial } })
        }
      },

      resetCamera: (playerId) => {
        if (playerId === 1) {
          set({ cameraP1: { ...DEFAULT_CAMERA_PREFS } })
        } else if (playerId === 2) {
          set({ cameraP2: { ...DEFAULT_CAMERA_PREFS } })
        } else {
          set({
            cameraP1: { ...DEFAULT_CAMERA_PREFS },
            cameraP2: { ...DEFAULT_CAMERA_PREFS },
          })
        }
      },

      setPaddleSpeed: (playerId, v) => {
        const level = clamp01(v)
        if (playerId === 1) set({ paddleSpeedP1: level })
        else set({ paddleSpeedP2: level })
      },

      setWinTarget: (v) => set({ winTarget: normalizeWinTarget(v) }),

      setCpuDifficulty: (v) => set({ cpuDifficulty: normalizeCpuDifficulty(v) }),
    }),
    {
      name: 'hockey-table-settings',
      version: 3,
      onRehydrateStorage: () => (state) => {
        if (state) applyToEngine(state)
      },
      migrate: (persisted, version) => {
        const p = persisted as LegacyPersisted & Partial<SettingsStore>
        let next = { ...p } as Partial<SettingsStore>
        if (version < 2 && p.camera) {
          const cam = { ...DEFAULT_CAMERA_PREFS, ...p.camera }
          next = {
            ...next,
            cameraP1: cam,
            cameraP2: { ...DEFAULT_CAMERA_PREFS },
            paddleSpeedP1: p.paddleSpeedP1 ?? 1,
            paddleSpeedP2: p.paddleSpeedP2 ?? 1,
          }
        }
        if (version < 3) {
          next.winTarget = normalizeWinTarget(next.winTarget ?? DEFAULT_WIN_TARGET)
          next.cpuDifficulty = normalizeCpuDifficulty(next.cpuDifficulty ?? 3)
        }
        return next as SettingsStore
      },
      merge: (persisted, current) => {
        const p = persisted as Partial<SettingsStore> & LegacyPersisted
        const legacyCam = p.camera
        return {
          ...current,
          ...p,
          cameraP1: {
            ...DEFAULT_CAMERA_PREFS,
            ...(legacyCam ?? p.cameraP1 ?? {}),
          },
          cameraP2: {
            ...DEFAULT_CAMERA_PREFS,
            ...(p.cameraP2 ?? legacyCam ?? {}),
          },
          paddleSpeedP1: p.paddleSpeedP1 ?? 1,
          paddleSpeedP2: p.paddleSpeedP2 ?? 1,
          winTarget: normalizeWinTarget(p.winTarget ?? DEFAULT_WIN_TARGET),
          cpuDifficulty: normalizeCpuDifficulty(p.cpuDifficulty ?? 3),
        }
      },
    },
  ),
)
