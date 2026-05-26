import { PADDLE_SPAWN } from '../../constants/paddle'
import { COLORS } from '../../constants/table'
import { useDemoDualCpu } from '../../hooks/useDemoDualCpu'
import { Paddle } from './Paddle'

export function DemoPaddles() {
  useDemoDualCpu()

  return (
    <>
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
