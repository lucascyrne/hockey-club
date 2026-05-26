import { useSessionStore } from '../../stores/sessionStore'
import { GoalCamera } from './GoalCamera'
import { SceneContent } from './SceneContent'
import { SinglePlayerCamera } from './SinglePlayerCamera'
import { SplitScreenRenderer } from './SplitScreenRenderer'

export function Scene() {
  const matchMode = useSessionStore((s) => s.matchMode)

  if (matchMode === 'local2p') {
    return (
      <>
        <SceneContent />
        <GoalCamera playerId={1} />
        <GoalCamera playerId={2} />
        <SplitScreenRenderer />
      </>
    )
  }

  return (
    <>
      <SceneContent />
      <SinglePlayerCamera />
    </>
  )
}
