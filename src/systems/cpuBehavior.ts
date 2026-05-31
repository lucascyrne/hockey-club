/** @deprecated Import from `src/ai` — re-exports for backward compatibility. */
export {
  cpuMaxChaseX,
  shouldHoldCpuPosition,
  updateCpuFsm as updateCpuBehavior,
} from '../ai/fsm/transitions'

export {
  puckThreatensCpuGoal,
  puckThreatensP1Goal,
} from '../ai/prediction/puckPath'

export {
  puckThreatensPlayerGoal,
} from '../ai/prediction/threat'

export {
  createCpuFsmContext as createCpuBehaviorState,
  fsmToLegacyMode,
  type CpuFsmState,
  type CpuLegacyMode as CpuMode,
  type CpuFsmContext as CpuBehaviorState,
} from '../ai/fsm/types'

import { CPU_DEFENSE_X } from '../constants/cpu'

export function cpuDefenseAnchorX() {
  return CPU_DEFENSE_X
}
