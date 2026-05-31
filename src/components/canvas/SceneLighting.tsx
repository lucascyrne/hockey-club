import { THEME } from '../../theme/palette'

const HERO_FOG = '#04030a'

type SceneLightingProps = {
  variant?: 'match' | 'hero'
}

export function SceneLighting({ variant = 'match' }: SceneLightingProps) {
  const isHero = variant === 'hero'
  const fogNear = isHero ? 8 : 3
  const fogFar = isHero ? 28 : 14
  const fogColor = isHero ? HERO_FOG : THEME.colors.fog

  return (
    <>
      <ambientLight intensity={isHero ? 0.45 : 0.48} />
      <directionalLight
        position={[4, 9, 6]}
        intensity={isHero ? 0.5 : 1.3}
        castShadow={!isHero}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      {isHero ? (
        <spotLight
          position={[0, 7, 0.5]}
          angle={0.42}
          penumbra={0.4}
          intensity={2}
          color={THEME.colors.tableBorder}
          distance={16}
          decay={2}
        >
          <object3D attach="target" position={[0, 0, 0]} />
        </spotLight>
      ) : (
        <pointLight
          position={[0, 3, 0]}
          intensity={0.35}
          color={THEME.colors.tableBorder}
          distance={8}
        />
      )}
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
    </>
  )
}
