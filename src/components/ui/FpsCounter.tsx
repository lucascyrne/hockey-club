import { useFps } from '../../hooks/useFps'
import { usePing } from '../../hooks/usePing'
import { useSessionStore } from '../../stores/sessionStore'

export function FpsCounter() {
  const fps = useFps()
  const isOnline = useSessionStore((s) => s.matchMode === 'online')
  const ping = usePing(isOnline)

  return (
    <div className="game-hud__fps" aria-live="polite">
      {fps} FPS{isOnline && ping !== null ? ` · ${ping} ms` : ''}
    </div>
  )
}
