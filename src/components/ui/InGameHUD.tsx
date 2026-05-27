import { useState, type CSSProperties } from 'react'
import { useTranslation } from '../../i18n'
import { useGameLayout } from '../../hooks/useGameLayout'
import { useSessionStore } from '../../stores/sessionStore'
import { useGameStore } from '../../stores/gameStore'
import { restartCurrentMatch } from '../../systems/restartMatch'
import { useArenaFx } from '../../hooks/useArenaFx'
import { FpsCounter } from './FpsCounter'
import { GameHudDrawer } from './GameHudDrawer'
import { Scoreboard } from './Scoreboard'
import type { ScoreboardVariant } from './Scoreboard'
import '../../styles/game-hud.css'

export function InGameHUD() {
  const { t } = useTranslation()
  const { splitAxis, isMobile } = useGameLayout()
  const { pulse } = useArenaFx()
  const matchMode = useSessionStore((s) => s.matchMode)
  const scoreP1 = useGameStore((s) => s.scoreP1)
  const scoreP2 = useGameStore((s) => s.scoreP2)
  const phase = useGameStore((s) => s.phase)
  const winner = useGameStore((s) => s.winner)
  const [showHint, setShowHint] = useState(false)
  const { isGoalFlashing } = useArenaFx()

  const p2Name = matchMode === 'vsCpu' ? 'CPU' : 'P2'
  const is2p = matchMode === 'local2p'
  const splitHorizontal = is2p && splitAxis === 'horizontal'

  const scoreVariant: ScoreboardVariant = is2p ? 'split' : 'top'

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

  const hint =
    matchMode === 'vsCpu'
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
      />

      <GameHudDrawer
        hint={hint}
        showHint={showHint}
        onToggleHint={() => setShowHint((v) => !v)}
      />

      <FpsCounter />

      {banner && (
        <div
          className={`game-hud__overlay${phase === 'gameOver' ? ' game-hud__overlay--game-over' : ''}`}
        >
          <p className={`game-hud__banner ${bannerClass}`}>{banner}</p>
          {phase === 'gameOver' && (
            <div className="game-hud__overlay-actions">
              <button
                type="button"
                className="game-hud__btn game-hud__btn--primary"
                onClick={restartCurrentMatch}
              >
                {t.hud.restart}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
