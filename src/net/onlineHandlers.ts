import type { S2C } from '../../shared/protocol'
import { playGoalSfx } from '../audio/events'
import { applySnapshot, resetOnlineNetState, setNetInterpDelayMs, TICK_MS } from '../lib/onlineNetState'
import { useArenaFxStore } from '../stores/arenaFxStore'
import { useRoundCountdownStore } from '../stores/roundCountdownStore'
import { useGameStore } from '../stores/gameStore'
import { usePuckFlowStore } from '../stores/puckFlowStore'
import { useOnlineStore } from '../stores/onlineStore'
import { useSessionStore } from '../stores/sessionStore'
export function handleServerMessage(msg: S2C) {
  switch (msg.t) {
    case 'room':
      useOnlineStore.getState().setRoom(msg.code, msg.role)
      break
    case 'peer':
      if (msg.status === 'joined') {
        useOnlineStore.getState().setPeerJoined(true)
      } else {
        useOnlineStore.getState().setPeerJoined(false)
        useOnlineStore.getState().setDisconnectMessage(true)
        window.setTimeout(() => {
          useSessionStore.getState().exitOnline()
        }, 3000)
      }
      break
    case 'match': {
      resetOnlineNetState()
      setNetInterpDelayMs(TICK_MS)
      const role = useOnlineStore.getState().role ?? 1
      useOnlineStore.getState().setRematchReady(false, false)
      useOnlineStore.getState().setWinTarget(msg.winTarget)
      useOnlineStore.getState().setStatus('playing')
      useSessionStore.getState().startOnlineMatch(role, msg.winTarget)
      break
    }
    case 'rematch': {
      const localRole = useOnlineStore.getState().role ?? 1
      const localReady = localRole === 1 ? msg.ready[0] : msg.ready[1]
      const peerReady = localRole === 1 ? msg.ready[1] : msg.ready[0]
      useOnlineStore.getState().setRematchReady(localReady, peerReady)
      break
    }
    case 'snapshot':
      applySnapshot(msg.snapshot)
      syncGameFromSnapshot(msg.snapshot)
      break
    case 'goal':
      playGoalSfx()
      useArenaFxStore.getState().triggerImpact(0.85)
      break
    case 'error':
      useOnlineStore.getState().setError(msg.code)
      break
    default:
      break
  }
}

function syncGameFromSnapshot(
  snapshot: import('../../shared/protocol').SnapshotPayload,
) {
  const game = useGameStore.getState()
  if (game.scoreP1 !== snapshot.scores[0] || game.scoreP2 !== snapshot.scores[1]) {
    useGameStore.setState({
      scoreP1: snapshot.scores[0],
      scoreP2: snapshot.scores[1],
    })
  }

  if (game.phase !== snapshot.phase) {
    if (snapshot.phase === 'playing' && game.phase === 'countdown') {
      useGameStore.getState().resumePlaying()
    } else if (snapshot.phase === 'countdown' && game.phase !== 'countdown') {
      useGameStore.getState().enterCountdown()
    } else if (snapshot.phase === 'gameOver') {
      const winner =
        snapshot.scores[0] >= game.winTarget
          ? 1
          : snapshot.scores[1] >= game.winTarget
            ? 2
            : null
      useGameStore.setState({ phase: 'gameOver', winner })
    } else {
      useGameStore.setState({ phase: snapshot.phase })
    }
  }

  useRoundCountdownStore.getState().setStep(snapshot.countdownStep)

  const flow = snapshot.flow
  const puckFlow = usePuckFlowStore.getState().flow
  if (flow !== puckFlow) {
    if (flow === 'held') usePuckFlowStore.getState().holdForFaceoff()
    else if (flow === 'play') usePuckFlowStore.getState().resetFlow()
    else if (flow === 'inChute') {
      /* visual chute driven by phase goal on client */
    }
  }
}

export function cleanupOnlineSession() {
  resetOnlineNetState()
  useOnlineStore.getState().reset()
}
