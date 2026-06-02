import { sendC2S } from '../net/wsClient'
import { useOnlineStore } from '../stores/onlineStore'

/** Pede revanche ao servidor (requer confirmação do outro jogador). */
export function requestOnlineRematch() {
  useOnlineStore.getState().setLocalRematchReady(true)
  sendC2S({ t: 'rematch' })
}
