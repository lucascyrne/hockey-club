import { Canvas } from '@react-three/fiber'
import { lazy, Suspense } from 'react'
import { COLORS } from '../../constants/table'
import { IS_DEV } from '../../lib/env'
import { Scene } from './Scene'

const DevPerf = IS_DEV
  ? lazy(() => import('./DevPerf').then((m) => ({ default: m.DevPerf })))
  : () => null

export function GameCanvas() {
  return (
    <Canvas
      className="game-canvas"
      shadows="soft"
      dpr={[1, 1.5]}
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
