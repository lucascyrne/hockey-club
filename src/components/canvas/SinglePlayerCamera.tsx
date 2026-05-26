import { lazy, Suspense } from 'react'
import { IS_DEV } from '../../lib/env'
import { useSessionStore } from '../../stores/sessionStore'
import { GoalCamera } from './GoalCamera'

const DevCameraTools = IS_DEV
  ? lazy(() =>
      import('./DevCameraTools').then((m) => ({ default: m.DevCameraTools })),
    )
  : null

export function SinglePlayerCamera() {
  const matchMode = useSessionStore((s) => s.matchMode)
  const localPlayerId = useSessionStore((s) => s.localPlayerId)

  if (matchMode === 'local2p') return null

  if (IS_DEV && DevCameraTools) {
    return (
      <Suspense
        fallback={<GoalCamera playerId={localPlayerId} makeDefault />}
      >
        <DevCameraTools localPlayerId={localPlayerId} />
      </Suspense>
    )
  }

  return <GoalCamera playerId={localPlayerId} makeDefault />
}
