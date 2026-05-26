import { THEME } from '../../theme/palette'

type SceneLightingProps = {
  variant?: 'match' | 'hero'
}

export function SceneLighting({ variant = 'match' }: SceneLightingProps) {
  const fogNear = variant === 'hero' ? 4 : 3
  const fogFar = variant === 'hero' ? 18 : 14
  const shadows = variant === 'match'

  return (
    <>
      <ambientLight intensity={variant === 'hero' ? 0.42 : 0.48} />
      <directionalLight
        position={[4, 9, 6]}
        intensity={variant === 'hero' ? 1.1 : 1.3}
        castShadow={shadows}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <pointLight
        position={[0, 3, 0]}
        intensity={0.35}
        color={THEME.colors.tableBorder}
        distance={8}
      />
      <fog attach="fog" args={[THEME.colors.fog, fogNear, fogFar]} />
    </>
  )
}
