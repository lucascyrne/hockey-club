import { useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useSessionStore } from '../stores/sessionStore'

/** Esc / P — menu lateral; Esc com configurações abertas fecha só o painel. */
export function useMatchHudMenu() {
  const screen = useSessionStore((s) => s.screen)
  const matchMode = useSessionStore((s) => s.matchMode)

  useEffect(() => {
    if (screen !== 'match' || matchMode === 'online') return

    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (useGameStore.getState().phase === 'countdown') return

      const state = useSessionStore.getState()
      const { settingsOpen, hudDrawerOpen, setSettingsOpen, setHudDrawerOpen } = state

      if (e.key === 'Escape') {
        if (settingsOpen) {
          e.preventDefault()
          setSettingsOpen(false)
          return
        }
        if (hudDrawerOpen) {
          e.preventDefault()
          setHudDrawerOpen(false)
          return
        }
        e.preventDefault()
        setHudDrawerOpen(true)
        return
      }

      if (e.code === 'KeyP') {
        if (settingsOpen) return
        e.preventDefault()
        setHudDrawerOpen(!hudDrawerOpen)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen, matchMode])
}
