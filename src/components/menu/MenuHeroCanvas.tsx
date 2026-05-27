import { Canvas } from '@react-three/fiber'
import { MenuHeroScene } from './MenuHeroScene'

export function MenuHeroCanvas() {
  return (
    <div className="main-menu__hero" aria-hidden>
      <Canvas
        shadows={false}
        dpr={[1, 1.25]}
        frameloop="always"
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
        }}
        style={{ pointerEvents: 'none' }}
      >
        <color attach="background" args={['#030208']} />
        <MenuHeroScene />
      </Canvas>
    </div>
  )
}
