import { Canvas } from '@react-three/fiber'
import { lazy, Suspense } from 'react'
import { COLORS } from '../../constants/table'
import { useGameLayout } from '../../hooks/useGameLayout'
import { IS_DEV } from '../../lib/env'
import { Scene } from './Scene'

const DevPerf = IS_DEV
  ? lazy(() => import('./DevPerf').then((m) => ({ default: m.DevPerf })))
  : () => null

export function GameCanvas() {
  const { isMobile } = useGameLayout()
  const dpr: [number, number] = isMobile ? [1, 1.25] : [1, 1.5]

  return (
    <Canvas
      className="game-canvas"
      shadows="soft"
      dpr={dpr}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
      }}
    >
      <color attach="background" args={[COLORS.background]} />
      {IS_DEV && (
        <Suspense fallback={null}>
          <DevPerf />
        </Suspense>
      )}
      <Scene />
    </Canvas>
  )
}
