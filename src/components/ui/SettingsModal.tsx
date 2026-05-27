import { useEffect } from 'react'

import { useTranslation } from '../../i18n'

import { useSettingsStore } from '../../stores/settingsStore'

import { LanguagePicker } from './LanguagePicker'

import '../../styles/settings.css'



type SettingsModalProps = {

  open: boolean

  onClose: () => void

}



function VolumeSlider({

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



export function SettingsModal({ open, onClose }: SettingsModalProps) {

  const { t } = useTranslation()

  const masterVolume = useSettingsStore((s) => s.masterVolume)

  const sfxVolume = useSettingsStore((s) => s.sfxVolume)

  const bgmVolume = useSettingsStore((s) => s.bgmVolume)

  const muted = useSettingsStore((s) => s.muted)

  const setMasterVolume = useSettingsStore((s) => s.setMasterVolume)

  const setSfxVolume = useSettingsStore((s) => s.setSfxVolume)

  const setBgmVolume = useSettingsStore((s) => s.setBgmVolume)

  const setMuted = useSettingsStore((s) => s.setMuted)



  useEffect(() => {

    if (!open) return

    const onKey = (e: KeyboardEvent) => {

      if (e.key === 'Escape') onClose()

    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)

  }, [open, onClose])



  if (!open) return null



  return (

    <div className="settings-backdrop" onClick={onClose} role="presentation">

      <div

        className="settings-panel"

        role="dialog"

        aria-modal="true"

        aria-labelledby="settings-title"

        onClick={(e) => e.stopPropagation()}

      >

        <header className="settings__header">

          <h2 id="settings-title" className="settings__title">

            {t.settings.title}

          </h2>

        </header>



        <div className="settings__body">

          <section className="settings__section" aria-labelledby="settings-lang-heading">

            <h3 id="settings-lang-heading" className="settings__section-title">

              {t.settings.languageSection}

            </h3>

            <LanguagePicker idPrefix="settings-lang" />

          </section>



          <section className="settings__section" aria-labelledby="settings-audio-heading">

            <h3 id="settings-audio-heading" className="settings__section-title">

              {t.settings.audioSection}

            </h3>

            <VolumeSlider

              id="settings-master"

              label={t.settings.masterVolume}

              value={masterVolume}

              onChange={setMasterVolume}

            />

            <VolumeSlider

              id="settings-bgm"

              label={t.settings.music}

              value={bgmVolume}

              onChange={setBgmVolume}

            />

            <VolumeSlider

              id="settings-sfx"

              label={t.settings.sfx}

              value={sfxVolume}

              onChange={setSfxVolume}

            />



            <label className="settings__toggle">

              <input

                type="checkbox"

                checked={muted}

                onChange={(e) => setMuted(e.target.checked)}

              />

              <span>{t.settings.muteAll}</span>

            </label>

          </section>

        </div>



        <footer className="settings__footer">

          <button type="button" className="settings__btn" onClick={onClose}>

            {t.settings.back}

          </button>

        </footer>

      </div>

    </div>

  )

}


