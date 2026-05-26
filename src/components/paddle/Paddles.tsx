import { PADDLE_SPAWN } from '../../constants/paddle'
import { COLORS } from '../../constants/table'
import { DevOnly } from '../dev/DevOnly'
import { useCpuPaddle } from '../../hooks/useCpuPaddle'
import { usePaddleInput } from '../../hooks/usePaddleInput'
import { Paddle } from './Paddle'
import { PlayerArmGuide } from './PlayerArmGuide'

export function Paddles() {
  usePaddleInput()
  useCpuPaddle()

  return (
    <>
      <DevOnly>
        <PlayerArmGuide playerId={1} color={COLORS.paddleP1} />
        <PlayerArmGuide playerId={2} color={COLORS.paddleP2} />
      </DevOnly>
      <Paddle
        playerId={1}
        color={COLORS.paddleP1}
        emissive={COLORS.paddleP1Emissive}
        spawn={PADDLE_SPAWN.p1}
      />
      <Paddle
        playerId={2}
        color={COLORS.paddleP2}
        emissive={COLORS.paddleP2Emissive}
        spawn={PADDLE_SPAWN.p2}
      />
    </>
  )
}
