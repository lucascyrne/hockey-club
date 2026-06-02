import { getSplitAxis } from '../stores/layoutStore'
import { isLocal2pMode } from '../stores/sessionStore'
import { shouldFlipP2View } from './splitViewport'

/** Vista P2 invertida no split horizontal (câmera + toque + setas). */
export function isP2HorizontalFlippedView(): boolean {
  return isLocal2pMode() && shouldFlipP2View(getSplitAxis())
}
