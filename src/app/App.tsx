import { Leva } from 'leva'
import { AudioHost } from '../components/audio/AudioHost'
import { ArenaFxBridge } from '../components/game/ArenaFxBridge'
import { LocaleSync } from '../components/i18n/LocaleSync'
import { DevOnly } from '../components/dev/DevOnly'
import { MatchShell } from '../components/ui/MatchShell'
import { MainMenu } from '../components/ui/MainMenu'
import { IS_DEV } from '../lib/env'
import { useSessionStore } from '../stores/sessionStore'
import '../styles/tokens.css'

export function App() {
  const screen = useSessionStore((s) => s.screen)

  return (
    <div className="app">
      <LocaleSync />
      <AudioHost />
      <ArenaFxBridge />
      <DevOnly>
        <Leva collapsed hidden={!IS_DEV} />
      </DevOnly>
      {screen === 'menu' ? <MainMenu /> : <MatchShell />}
    </div>
  )
}
