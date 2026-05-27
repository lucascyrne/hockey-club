import { useEffect, useRef } from 'react'
import { TICK_MS, type StatePayload } from '../../shared/protocol'
import { sendC2S, setWsHandlers, isWsConnected } from '../net/wsClient'
import { handleServerMessage } from '../net/onlineHandlers'
import {
  isOnlineGuest,
  isOnlineHost,
  isOnlineMode,
  useSessionStore,
} from '../stores/sessionStore'
import { useGameStore } from '../stores/gameStore'
import { usePuckFlowStore } from '../stores/puckFlowStore'
import { useRoundCountdownStore } from '../stores/roundCountdownStore'
import { paddleTargets } from '../stores/paddleTargets'
import { getPuckSample } from '../lib/puckTracker'
import { nextInputSeq, nextStateSeq } from '../net/onlineSyncSeq'

function buildStatePayload(): StatePayload {
  const game = useGameStore.getState()
  const puck = getPuckSample()
  return {
    seq: nextStateSeq(),
    puck: { x: puck.x, z: puck.z, vx: puck.vx, vz: puck.vz },
    p1: { x: paddleTargets.p1.x, z: paddleTargets.p1.z },
    p2: { x: paddleTargets.p2.x, z: paddleTargets.p2.z },
    phase: game.phase,
    scores: [game.scoreP1, game.scoreP2],
    countdownStep: useRoundCountdownStore.getState().step,
    flow: usePuckFlowStore.getState().flow,
  }
}

export function broadcastGoal(scorer: 1 | 2) {
  if (!isOnlineHost()) return
  sendC2S({ t: 'goal', scorer })
}

export function useOnlineSync() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isOnlineMode()) return

    setWsHandlers({ onMessage: handleServerMessage })

    intervalRef.current = setInterval(() => {
      if (!isWsConnected()) return

      if (isOnlineHost()) {
        sendC2S({ t: 'state', state: buildStatePayload() })
      } else if (isOnlineGuest()) {
        const localId = useSessionStore.getState().localPlayerId
        const target = localId === 1 ? paddleTargets.p1 : paddleTargets.p2
        sendC2S({
          t: 'input',
          seq: nextInputSeq(),
          px: target.x,
          pz: target.z,
        })
      }
    }, TICK_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])
}
