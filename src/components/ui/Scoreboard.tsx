import '../../styles/scoreboard.css'

export type ScoreboardVariant = 'top' | 'center' | 'split' | 'dualTop'

type ScoreboardProps = {
  variant: ScoreboardVariant
  scoreP1: number
  scoreP2: number
  p2Label: string
  winTarget: number
}

function ScoreboardFace({
  scoreP1,
  scoreP2,
  p2Label,
  winTarget,
  className,
}: {
  scoreP1: number
  scoreP2: number
  p2Label: string
  winTarget: number
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
        <span className="scoreboard__target">/{winTarget}</span>
      </div>
      <div className="scoreboard__divider" aria-hidden />
      <div className="scoreboard__panel scoreboard__panel--p2">
        <span className="scoreboard__name scoreboard__name--p2">{p2Label}</span>
        <span className="scoreboard__num scoreboard__num--p2">{scoreP2}</span>
      </div>
    </div>
  )
}

export function Scoreboard({
  variant,
  scoreP1,
  scoreP2,
  p2Label,
  winTarget,
}: ScoreboardProps) {
  const faceProps = { scoreP1, scoreP2, p2Label, winTarget }

  if (variant === 'dualTop') {
    return (
      <div className="scoreboard scoreboard--dual-top" aria-live="polite">
        <div className="scoreboard__slot scoreboard__slot--p1">
          <ScoreboardFace {...faceProps} />
        </div>
        <div className="scoreboard__slot scoreboard__slot--p2">
          <ScoreboardFace {...faceProps} />
        </div>
      </div>
    )
  }

  if (variant === 'split') {
    return (
      <div className="scoreboard scoreboard--split" aria-live="polite">
        <ScoreboardFace {...faceProps} className="scoreboard__face--p2" />
        <ScoreboardFace {...faceProps} className="scoreboard__face--p1" />
      </div>
    )
  }

  return (
    <div className={`scoreboard scoreboard--${variant}`} aria-live="polite">
      <ScoreboardFace {...faceProps} />
    </div>
  )
}
