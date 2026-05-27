import type { S2C } from '../../shared/protocol'
import { useRoundCountdownStore } from '../stores/roundCountdownStore'
import { useGameStore } from '../stores/gameStore'
import { usePuckFlowStore } from '../stores/puckFlowStore'
import { useOnlineStore } from '../stores/onlineStore'
import { useSessionStore } from '../stores/sessionStore'
import { paddleTargets } from '../stores/paddleTargets'
import {
  applyGuestState,
  onlineRemoteInput,
  resetOnlineNetState,
} from '../lib/onlineNetState'
import { resetOnlineSyncSeq } from './onlineSyncSeq'
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
      resetOnlineSyncSeq()
      resetOnlineNetState()
      useOnlineStore.getState().setWinTarget(msg.winTarget)
      useOnlineStore.getState().setStatus('playing')
      const role = useOnlineStore.getState().role ?? 1
      useSessionStore.getState().startOnlineMatch(role, msg.winTarget)
      break
    }
    case 'state':
      applyNetState(msg.state)
      break
    case 'remoteInput':
      if (useOnlineStore.getState().role === 1) {
        handleRelayedInput(msg)
      }
      break
    case 'goal':
      applyNetGoal(msg.scorer)
      break
    case 'error':
      useOnlineStore.getState().setError(msg.code)
      break
    default:
      break
  }
}

function applyNetState(state: import('../../shared/protocol').StatePayload) {
  if (useOnlineStore.getState().role !== 2) return
  applyGuestState(state)
  syncGuestGameFromState(state)
}

function syncGuestGameFromState(
  state: import('../../shared/protocol').StatePayload,
) {
  const game = useGameStore.getState()
  if (game.scoreP1 !== state.scores[0] || game.scoreP2 !== state.scores[1]) {
    useGameStore.setState({
      scoreP1: state.scores[0],
      scoreP2: state.scores[1],
    })
  }

  if (game.phase !== state.phase) {
    if (state.phase === 'playing' && game.phase === 'countdown') {
      useGameStore.getState().resumePlaying()
    } else if (state.phase === 'countdown' && game.phase !== 'countdown') {
      useGameStore.getState().enterCountdown()
    } else {
      useGameStore.setState({ phase: state.phase })
    }
  }

  const localId = useSessionStore.getState().localPlayerId
  if (localId !== 1) {
    paddleTargets.p1.x = state.p1.x
    paddleTargets.p1.z = state.p1.z
  }
  if (localId !== 2) {
    paddleTargets.p2.x = state.p2.x
    paddleTargets.p2.z = state.p2.z
  }

  const step = state.countdownStep
  useRoundCountdownStore.getState().setStep(step)

  const flow = state.flow
  const puckFlow = usePuckFlowStore.getState().flow
  if (flow !== puckFlow) {
    if (flow === 'held') usePuckFlowStore.getState().holdForFaceoff()
    else if (flow === 'play') usePuckFlowStore.getState().resetFlow()
  }
}

function applyNetGoal(scorer: 1 | 2) {
  const role = useOnlineStore.getState().role
  if (role !== 2) return
  const phase = useGameStore.getState().phase
  if (phase !== 'playing') return
  useGameStore.getState().onGoal(scorer)
}

export function handleRelayedInput(msg: { seq: number; px: number; pz: number }) {
  if (msg.seq <= onlineRemoteInput.seq) return
  onlineRemoteInput.seq = msg.seq
  onlineRemoteInput.px = msg.px
  onlineRemoteInput.pz = msg.pz
  paddleTargets.p2.x = msg.px
  paddleTargets.p2.z = msg.pz
}

export function cleanupOnlineSession() {
  resetOnlineNetState()
  useOnlineStore.getState().reset()
}
