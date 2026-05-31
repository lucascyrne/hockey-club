import { playCountdownPuckSfx, playCountdownTickSfx } from '../audio/events'
import { ROUND_COUNTDOWN_PUCK_MS, ROUND_COUNTDOWN_STEP_MS } from '../constants/game'
import { isMenuDemoActive } from '../stores/menuDemoStore'
import { useGameStore } from '../stores/gameStore'
import { usePuckFlowStore } from '../stores/puckFlowStore'
import { useRoundCountdownStore } from '../stores/roundCountdownStore'
import { stageFaceoffHold, triggerFaceoff } from '../stores/puckActions'
import { getLateralFaceoffSpawn, type PuckSpawnState } from './puckSpawn'

let sequenceToken = 0

export function cancelRoundCountdown() {
  sequenceToken += 1
  useRoundCountdownStore.getState().setStep(null)
}

export function beginRoundCountdown() {
  if (isMenuDemoActive()) {
    usePuckFlowStore.getState().resetFlow()
    useGameStore.getState().resumePlaying()
    triggerFaceoff(getLateralFaceoffSpawn())
    return
  }

  const token = ++sequenceToken
  const spawn = getLateralFaceoffSpawn()

  useGameStore.getState().enterCountdown()
  usePuckFlowStore.getState().holdForFaceoff()
  stageFaceoffHold(spawn)

  const numericSteps: Array<1 | 2 | 3> = [1, 2, 3]
  let delay = 0

  for (const step of numericSteps) {
    setTimeout(() => {
      if (token !== sequenceToken) return
      useRoundCountdownStore.getState().setStep(step)
      playCountdownTickSfx(step)
    }, delay)
    delay += ROUND_COUNTDOWN_STEP_MS
  }

  setTimeout(() => {
    if (token !== sequenceToken) return
    useRoundCountdownStore.getState().setStep('puck')
    playCountdownPuckSfx()
  }, delay)

  delay += ROUND_COUNTDOWN_PUCK_MS

  setTimeout(() => {
    launchRound(spawn, token)
  }, delay)
}

function launchRound(spawn: PuckSpawnState, token: number) {
  if (token !== sequenceToken) return
  useRoundCountdownStore.getState().setStep(null)
  usePuckFlowStore.getState().resetFlow()
  useGameStore.getState().resumePlaying()
  triggerFaceoff(spawn)
}
