import { useTranslation } from '../../i18n'
import { useGameStore } from '../../stores/gameStore'
import { useRoundCountdownStore } from '../../stores/roundCountdownStore'
import '../../styles/round-countdown.css'

export function RoundCountdown() {
  const { t } = useTranslation()
  const phase = useGameStore((s) => s.phase)
  const step = useRoundCountdownStore((s) => s.step)

  if (phase !== 'countdown' || step === null) return null

  const isPuck = step === 'puck'
  const label = isPuck ? t.hud.countdownPuck : String(step)

  return (
    <div className="round-countdown" aria-live="assertive" aria-atomic="true">
      <div className={`round-countdown__stage${isPuck ? ' round-countdown__stage--puck' : ''}`}>
        <span
          key={step}
          className={`round-countdown__label${isPuck ? ' round-countdown__label--puck' : ''}`}
        >
          {label}
        </span>
        <span
          className={`round-countdown__ring${isPuck ? ' round-countdown__ring--puck' : ''}`}
          aria-hidden
        />
      </div>
    </div>
  )
}
