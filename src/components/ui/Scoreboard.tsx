import { WIN_TARGET } from '../../constants/game'
import '../../styles/scoreboard.css'

export type ScoreboardVariant = 'top' | 'center' | 'split'

type ScoreboardProps = {
  variant: ScoreboardVariant
  scoreP1: number
  scoreP2: number
  p2Label: string
}

function ScoreboardFace({
  scoreP1,
  scoreP2,
  p2Label,
  className,
}: {
  scoreP1: number
  scoreP2: number
  p2Label: string
  className?: string
}) {
  const faceClass = ['scoreboard__face', className].filter(Boolean).join(' ')
  return (
    <div className={faceClass}>
      <div className="scoreboard__panel scoreboard__panel--p1">
        <span className="scoreboard__name scoreboard__name--p1">P1</span>
        <span className="scoreboard__num scoreboard__num--p1">{scoreP1}</span>
      </div>
      <div className="scoreboard__center">
        <span className="scoreboard__target">/{WIN_TARGET}</span>
      </div>
      <div className="scoreboard__divider" aria-hidden />
      <div className="scoreboard__panel scoreboard__panel--p2">
        <span className="scoreboard__name scoreboard__name--p2">{p2Label}</span>
        <span className="scoreboard__num scoreboard__num--p2">{scoreP2}</span>
      </div>
    </div>
  )
}

export function Scoreboard({ variant, scoreP1, scoreP2, p2Label }: ScoreboardProps) {
  if (variant === 'split') {
    return (
      <div className="scoreboard scoreboard--split" aria-live="polite">
        {/* P2 primeiro (metade de cima); P1 segundo (metade de baixo) */}
        <ScoreboardFace
          scoreP1={scoreP1}
          scoreP2={scoreP2}
          p2Label={p2Label}
          className="scoreboard__face--p2"
        />
        <ScoreboardFace
          scoreP1={scoreP1}
          scoreP2={scoreP2}
          p2Label={p2Label}
          className="scoreboard__face--p1"
        />
      </div>
    )
  }

  return (
    <div className={`scoreboard scoreboard--${variant}`} aria-live="polite">
      <ScoreboardFace scoreP1={scoreP1} scoreP2={scoreP2} p2Label={p2Label} />
    </div>
  )
}
