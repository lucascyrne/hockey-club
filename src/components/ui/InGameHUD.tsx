import { useState } from 'react'

import { WIN_TARGET } from '../../constants/game'

import { useTranslation } from '../../i18n'

import { useSessionStore } from '../../stores/sessionStore'

import { useGameStore } from '../../stores/gameStore'

import { restartCurrentMatch } from '../../systems/restartMatch'
import { useArenaFx } from '../../hooks/useArenaFx'

import { FpsCounter } from './FpsCounter'

import { LanguageSwitcher } from './LanguageSwitcher'

import '../../styles/game-hud.css'



export function InGameHUD() {

  const { t } = useTranslation()

  const matchMode = useSessionStore((s) => s.matchMode)

  const exitMatch = useSessionStore((s) => s.exitMatch)

  const scoreP1 = useGameStore((s) => s.scoreP1)

  const scoreP2 = useGameStore((s) => s.scoreP2)

  const phase = useGameStore((s) => s.phase)

  const winner = useGameStore((s) => s.winner)

  const [showHint, setShowHint] = useState(false)
  const { isGoalFlashing } = useArenaFx()



  const p2Name = matchMode === 'vsCpu' ? 'CPU' : 'P2'



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



  const hint = matchMode === 'vsCpu' ? t.hud.hintVsCpu : t.hud.hint2p



  return (

    <div className={`game-hud${isGoalFlashing ? ' game-hud--goal-flash' : ''}`}>

      {matchMode === 'local2p' && <div className="game-hud__split-line" />}



      <div className="game-hud__scorebar">

        <div className="game-hud__score-panel game-hud__score-panel--p1">

          <span className="game-hud__player-name game-hud__player-name--p1">P1</span>

          <span className="game-hud__score-num game-hud__score-num--p1">{scoreP1}</span>

        </div>

        <div className="game-hud__score-center">

          <span className="game-hud__target">/{WIN_TARGET}</span>

        </div>

        <div className="game-hud__divider" />

        <div className="game-hud__score-panel game-hud__score-panel--p2">

          <span className="game-hud__player-name game-hud__player-name--p2">

            {p2Name}

          </span>

          <span className="game-hud__score-num game-hud__score-num--p2">{scoreP2}</span>

        </div>

      </div>



      <div className="game-hud__actions">

        <LanguageSwitcher />

        <button

          type="button"

          className="game-hud__btn"

          onClick={() => setShowHint((v) => !v)}

          aria-expanded={showHint}

        >

          ?

        </button>

        <button type="button" className="game-hud__btn" onClick={exitMatch}>

          {t.hud.menu}

        </button>

      </div>



      {showHint && <p className="game-hud__hint">{hint}</p>}



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


