export function SegmentedOptions<T extends string | number>({
  idPrefix,
  ariaLabel,
  value,
  options,
  onChange,
}: {
  idPrefix: string
  ariaLabel: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div
      className="settings__option-grid settings__option-grid--triple"
      role="listbox"
      aria-label={ariaLabel}
    >
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          id={`${idPrefix}-${opt.value}`}
          type="button"
          role="option"
          aria-selected={value === opt.value}
          className={`settings__lang-option${value === opt.value ? ' settings__lang-option--active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function VolumeSlider({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: number
  onChange: (v: number) => void
}) {
  const pct = Math.round(value * 100)
  return (
    <label className="settings__field" htmlFor={id}>
      <span className="settings__label">
        {label}
        <span className="settings__value">{pct}%</span>
      </span>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={pct}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="settings__slider"
      />
    </label>
  )
}

export function ParamSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}) {
  return (
    <label className="settings__field" htmlFor={id}>
      <span className="settings__label">
        {label}
        <span className="settings__value">{format(value)}</span>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="settings__slider"
      />
    </label>
  )
}
