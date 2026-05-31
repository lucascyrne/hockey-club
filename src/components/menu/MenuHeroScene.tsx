import { HeroCameraRig } from '../canvas/HeroCameraRig'
import { LandingNeonRings } from './LandingNeonRings'
import { MenuHeroSceneContent } from './MenuHeroSceneContent'

export function MenuHeroScene() {
  return (
    <>
      <HeroCameraRig />
      <LandingNeonRings />
      <MenuHeroSceneContent />
    </>
  )
}
