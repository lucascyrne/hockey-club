import { useFps } from '../../hooks/useFps'

export function FpsCounter() {
  const fps = useFps()
  return <div className="game-hud__fps" aria-live="polite">{fps} FPS</div>
}
