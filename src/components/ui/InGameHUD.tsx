import { useState, type CSSProperties } from 'react'
import { useTranslation } from '../../i18n'
import { useGameLayout } from '../../hooks/useGameLayout'
import { useSessionStore } from '../../stores/sessionStore'
import { useGameStore } from '../../stores/gameStore'
import { requestOnlineRematch } from '../../systems/requestOnlineRematch'
import { restartCurrentMatch } from '../../systems/restartMatch'
import { useOnlineStore } from '../../stores/onlineStore'
import { useArenaFx } from '../../hooks/useArenaFx'
import { useMatchHudMenu } from '../../hooks/useMatchHudMenu'
import { FpsCounter } from './FpsCounter'
import { GameHudDrawer } from './GameHudDrawer'
import { Scoreboard } from './Scoreboard'
import type { ScoreboardVariant } from './Scoreboard'
import { RoundCountdown } from './RoundCountdown'
import { SettingsSheet } from './settings/SettingsSheet'
import '../../styles/game-hud.css'

export function InGameHUD() {
  useMatchHudMenu()
  const { t } = useTranslation()
  const { splitAxis, isMobile } = useGameLayout()
  const { pulse } = useArenaFx()
  const matchMode = useSessionStore((s) => s.matchMode)
  const settingsOpen = useSessionStore((s) => s.settingsOpen)
  const setSettingsOpen = useSessionStore((s) => s.setSettingsOpen)
  const scoreP1 = useGameStore((s) => s.scoreP1)
  const scoreP2 = useGameStore((s) => s.scoreP2)
  const winTarget = useGameStore((s) => s.winTarget)
  const phase = useGameStore((s) => s.phase)
  const winner = useGameStore((s) => s.winner)
  const [showHint, setShowHint] = useState(false)
  const { isGoalFlashing } = useArenaFx()
  const localRematchReady = useOnlineStore((s) => s.localRematchReady)
  const peerRematchReady = useOnlineStore((s) => s.peerRematchReady)

  const p2Name = matchMode === 'vsCpu' ? 'CPU' : matchMode === 'online' ? 'P2' : 'P2'
  const is2p = matchMode === 'local2p'
  const isOnline = matchMode === 'online'
  const splitHorizontal = is2p && splitAxis === 'horizontal'

  const scoreVariant: ScoreboardVariant = isOnline
    ? 'top'
    : is2p
      ? splitAxis === 'horizontal'
        ? 'split'
        : 'dualTop'
      : 'top'

  let banner: string | null = null
  let bannerClass = ''
  if (phase === 'goal') {
    banner = t.hud.goal
    bannerClass = 'game-hud__banner--goal'
  } else if (phase === 'gameOver' && winner) {
    banner =
      winner === 1
        ? t.hud.victory
        : matchMode === 'vsCpu'
          ? t.hud.cpuWon
          : t.hud.p2Won
    bannerClass = 'game-hud__banner--win'
  }

  const hint = isOnline
    ? t.hud.hintOnline
    : matchMode === 'vsCpu'
      ? t.hud.hintVsCpu
      : splitHorizontal
        ? t.hud.hint2pHorizontal
        : t.hud.hint2p

  const hudClass = [
    'game-hud',
    isMobile ? 'game-hud--mobile' : '',
    isGoalFlashing ? 'game-hud--goal-flash' : '',
    is2p ? (splitHorizontal ? 'game-hud--split-horizontal' : 'game-hud--split-lateral') : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div
        className={hudClass}
        style={{ '--arena-pulse': String(pulse) } as CSSProperties}
      >
        {is2p && <div className="game-hud__split-line" aria-hidden />}

        <Scoreboard
          variant={scoreVariant}
          scoreP1={scoreP1}
          scoreP2={scoreP2}
          p2Label={p2Name}
          winTarget={winTarget}
        />

        <GameHudDrawer
          hint={hint}
          showHint={showHint}
          onToggleHint={() => setShowHint((v) => !v)}
        />

        <FpsCounter />

        {banner && (
          <div
            className={`game-hud__overlay${phase === 'goal' ? ' game-hud__overlay--goal' : ''}${phase === 'gameOver' ? ' game-hud__overlay--game-over' : ''}`}
          >
            <p className={`game-hud__banner ${bannerClass}`}>{banner}</p>
            {phase === 'gameOver' && (
              <div className="game-hud__overlay-actions">
                {isOnline && localRematchReady && !peerRematchReady && (
                  <p className="game-hud__rematch-wait">{t.hud.waitingRematch}</p>
                )}
                <button
                  type="button"
                  className="game-hud__btn game-hud__btn--primary"
                  disabled={isOnline && localRematchReady}
                  onClick={() =>
                    isOnline ? requestOnlineRematch() : restartCurrentMatch()
                  }
                >
                  {t.hud.restart}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <RoundCountdown />

      {matchMode !== 'online' && (
        <SettingsSheet
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          cameraMode={is2p ? 'dual' : 'single'}
        />
      )}
    </>
  )
}
