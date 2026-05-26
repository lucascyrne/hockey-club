import { useEffect, useRef } from 'react'
import { setAudioVolumes, setBgm } from '../../audio/audioEngine'
import { playGoalSfx, playWinSfx } from '../../audio/events'
import { isMenuDemoActive } from '../../stores/menuDemoStore'
import { useGameStore } from '../../stores/gameStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useSettingsStore } from '../../stores/settingsStore'

/** BGM por tela e SFX de gol/vitória (fora do Canvas). */
export function AudioHost() {
  const screen = useSessionStore((s) => s.screen)
  const masterVolume = useSettingsStore((s) => s.masterVolume)
  const sfxVolume = useSettingsStore((s) => s.sfxVolume)
  const bgmVolume = useSettingsStore((s) => s.bgmVolume)
  const muted = useSettingsStore((s) => s.muted)

  const prevPhase = useRef(useGameStore.getState().phase)

  useEffect(() => {
    setAudioVolumes({ masterVolume, sfxVolume, bgmVolume, muted })
  }, [masterVolume, sfxVolume, bgmVolume, muted])

  useEffect(() => {
    if (screen === 'menu') {
      setBgm('menu')
      return
    }
    if (!isMenuDemoActive()) {
      setBgm('match')
    }
    return () => setBgm(null)
  }, [screen])

  useEffect(() => {
    if (screen !== 'match') return

    return useGameStore.subscribe((state) => {
      if (isMenuDemoActive()) {
        prevPhase.current = state.phase
        return
      }

      const prev = prevPhase.current

      if (prev === 'playing' && state.phase === 'goal') {
        playGoalSfx()
      }

      if (prev !== 'gameOver' && state.phase === 'gameOver') {
        playWinSfx()
      }

      prevPhase.current = state.phase
    })
  }, [screen])

  return null
}
