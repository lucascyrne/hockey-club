import { useFrame } from '@react-three/fiber'
import { useBeforePhysicsStep } from '@react-three/rapier'
import { useRef } from 'react'
import { stepOnlineInterpolation } from '../../lib/onlineNetState'
import { sendC2S, isWsConnected } from '../../net/wsClient'
import { paddleTargets } from '../../stores/paddleTargets'
import { isOnlineMode, useSessionStore } from '../../stores/sessionStore'

/** Interpolação de rede + envio de input (dentro do Canvas). */
export function OnlineCanvasSync() {
  const inputTick = useRef(0)
  const online = useSessionStore((s) => s.matchMode === 'online')

  useBeforePhysicsStep(() => {
    if (!isOnlineMode()) return
    stepOnlineInterpolation()
  })

  useFrame(() => {
    if (!online || !isWsConnected()) return
    inputTick.current += 1
    const localId = useSessionStore.getState().localPlayerId
    const target = localId === 1 ? paddleTargets.p1 : paddleTargets.p2
    sendC2S({
      t: 'input',
      tick: inputTick.current,
      px: target.x,
      pz: target.z,
    })
  })

  return null
}
