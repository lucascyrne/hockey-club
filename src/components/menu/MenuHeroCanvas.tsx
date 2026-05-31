import { Canvas } from '@react-three/fiber'
import { useLayoutStore } from '../../stores/layoutStore'
import { MenuHeroScene } from './MenuHeroScene'

export function MenuHeroCanvas() {
  const reduceMenuFx = useLayoutStore((s) => s.reduceMenuFx)

  return (
    <div className="main-menu__hero" aria-hidden>
      <Canvas
        shadows={false}
        dpr={reduceMenuFx ? [1, 1] : [1, 1.25]}
        frameloop="always"
        gl={{
          antialias: !reduceMenuFx,
          alpha: true,
          powerPreference: reduceMenuFx ? 'default' : 'high-performance',
        }}
        style={{ pointerEvents: 'none' }}
      >
        <MenuHeroScene />
      </Canvas>
    </div>
  )
}
