import { Leva } from 'leva'
import { AudioHost } from '../components/audio/AudioHost'
import { ArenaFxBridge } from '../components/game/ArenaFxBridge'
import { LayoutSync } from '../components/layout/LayoutSync'
import { LocaleSync } from '../components/i18n/LocaleSync'
import { CpuDebugPanel } from '../components/dev/CpuDebugPanel'
import { DevOnly } from '../components/dev/DevOnly'
import { MatchShell } from '../components/ui/MatchShell'
import { MainMenu } from '../components/ui/MainMenu'
import { OnlineLobby } from '../components/ui/OnlineLobby'
import { OnlineDisconnectOverlay } from '../components/ui/OnlineDisconnectOverlay'
import { IS_DEV } from '../lib/env'
import { useSessionStore } from '../stores/sessionStore'
import '../styles/tokens.css'

export function App() {
  const screen = useSessionStore((s) => s.screen)

  return (
    <div className="app">
      <LayoutSync />
      <LocaleSync />
      <AudioHost />
      <ArenaFxBridge />
      <DevOnly>
        <Leva collapsed hidden={!IS_DEV} />
        <CpuDebugPanel />
      </DevOnly>
      {screen === 'menu' && <MainMenu />}
      {screen === 'onlineLobby' && <OnlineLobby />}
      {screen === 'match' && <MatchShell />}
      <OnlineDisconnectOverlay />
    </div>
  )
}
