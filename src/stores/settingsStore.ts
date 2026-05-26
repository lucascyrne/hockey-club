import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAudioVolumes, type AudioVolumes } from '../audio/audioEngine'

type SettingsStore = AudioVolumes & {
  setMasterVolume: (v: number) => void
  setSfxVolume: (v: number) => void
  setBgmVolume: (v: number) => void
  setMuted: (muted: boolean) => void
  toggleMuted: () => void
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function applyToEngine(state: AudioVolumes) {
  setAudioVolumes(state)
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      masterVolume: 1,
      sfxVolume: 1,
      bgmVolume: 0.7,
      muted: false,

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
    }),
    {
      name: 'hockey-table-settings',
      onRehydrateStorage: () => (state) => {
        if (state) applyToEngine(state)
      },
    },
  ),
)
