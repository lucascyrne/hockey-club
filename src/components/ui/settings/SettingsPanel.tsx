import { useState } from 'react'
import { useTranslation } from '../../../i18n'
import { useSettingsStore } from '../../../stores/settingsStore'
import { LanguagePicker } from '../LanguagePicker'
import { CameraPrefsFields } from './CameraPrefsFields'
import type { CpuDifficulty, WinTarget } from '../../../lib/cpuDifficulty'
import { SegmentedOptions, VolumeSlider } from './SettingsControls'

const WIN_TARGETS: WinTarget[] = [3, 5, 7]
const CPU_LEVELS: CpuDifficulty[] = [1, 2, 3]

export type SettingsCameraMode = 'single' | 'dual'

type SettingsTab = 'general' | 'camera' | 'cameraP1' | 'cameraP2'

type SettingsPanelProps = {
  idPrefix?: string
  cameraMode: SettingsCameraMode
}

export function SettingsPanel({ idPrefix = 'settings', cameraMode }: SettingsPanelProps) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<SettingsTab>('general')

  const masterVolume = useSettingsStore((s) => s.masterVolume)
  const sfxVolume = useSettingsStore((s) => s.sfxVolume)
  const bgmVolume = useSettingsStore((s) => s.bgmVolume)
  const muted = useSettingsStore((s) => s.muted)
  const airLevel = useSettingsStore((s) => s.airLevel)
  const paddleSpeedP1 = useSettingsStore((s) => s.paddleSpeedP1)
  const paddleSpeedP2 = useSettingsStore((s) => s.paddleSpeedP2)
  const winTarget = useSettingsStore((s) => s.winTarget)
  const cpuDifficulty = useSettingsStore((s) => s.cpuDifficulty)

  const setMasterVolume = useSettingsStore((s) => s.setMasterVolume)
  const setSfxVolume = useSettingsStore((s) => s.setSfxVolume)
  const setBgmVolume = useSettingsStore((s) => s.setBgmVolume)
  const setMuted = useSettingsStore((s) => s.setMuted)
  const setAirLevel = useSettingsStore((s) => s.setAirLevel)
  const setPaddleSpeed = useSettingsStore((s) => s.setPaddleSpeed)
  const setWinTarget = useSettingsStore((s) => s.setWinTarget)
  const setCpuDifficulty = useSettingsStore((s) => s.setCpuDifficulty)

  const cpuLevelLabels: Record<CpuDifficulty, string> = {
    1: t.settings.cpuLevel1,
    2: t.settings.cpuLevel2,
    3: t.settings.cpuLevel3,
  }

  const tabs: { id: SettingsTab; label: string }[] =
    cameraMode === 'dual'
      ? [
          { id: 'general', label: t.settings.tabGeneral },
          { id: 'cameraP1', label: t.settings.tabCameraP1 },
          { id: 'cameraP2', label: t.settings.tabCameraP2 },
        ]
      : [
          { id: 'general', label: t.settings.tabGeneral },
          { id: 'camera', label: t.settings.tabCamera },
        ]

  return (
    <>
      <nav className="settings-tabs" aria-label={t.settings.title}>
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`settings-tabs__btn${tab === id ? ' settings-tabs__btn--active' : ''}`}
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="settings__body">
        {tab === 'general' && (
          <div className="settings-grid--general">
            <section className="settings__section" aria-labelledby={`${idPrefix}-lang`}>
              <h3 id={`${idPrefix}-lang`} className="settings__section-title">
                {t.settings.languageSection}
              </h3>
              <LanguagePicker idPrefix={`${idPrefix}-lang`} />
            </section>

            <section className="settings__section" aria-labelledby={`${idPrefix}-audio`}>
              <h3 id={`${idPrefix}-audio`} className="settings__section-title">
                {t.settings.audioSection}
              </h3>
              <VolumeSlider
                id={`${idPrefix}-master`}
                label={t.settings.masterVolume}
                value={masterVolume}
                onChange={setMasterVolume}
              />
              <VolumeSlider
                id={`${idPrefix}-bgm`}
                label={t.settings.music}
                value={bgmVolume}
                onChange={setBgmVolume}
              />
              <VolumeSlider
                id={`${idPrefix}-sfx`}
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

            <section
              className="settings__section settings-grid--general__gameplay"
              aria-labelledby={`${idPrefix}-gameplay`}
            >
              <h3 id={`${idPrefix}-gameplay`} className="settings__section-title">
                {t.settings.gameplaySection}
              </h3>
              <VolumeSlider
                id={`${idPrefix}-air`}
                label={t.settings.airLevel}
                value={airLevel}
                onChange={setAirLevel}
              />
              <p className="settings__hint">{t.settings.airLevelHint}</p>
              <VolumeSlider
                id={`${idPrefix}-paddle-p1`}
                label={
                  cameraMode === 'dual'
                    ? t.settings.paddleSpeedP1
                    : t.settings.paddleSpeed
                }
                value={paddleSpeedP1}
                onChange={(v) => setPaddleSpeed(1, v)}
              />
              {cameraMode === 'dual' && (
                <VolumeSlider
                  id={`${idPrefix}-paddle-p2`}
                  label={t.settings.paddleSpeedP2}
                  value={paddleSpeedP2}
                  onChange={(v) => setPaddleSpeed(2, v)}
                />
              )}
              <p className="settings__hint">{t.settings.paddleSpeedHint}</p>
              <div className="settings__field">
                <span className="settings__label settings__label--block">
                  {t.settings.winTarget}
                </span>
                <SegmentedOptions
                  idPrefix={`${idPrefix}-win`}
                  ariaLabel={t.settings.winTarget}
                  value={winTarget}
                  options={WIN_TARGETS.map((n) => ({
                    value: n,
                    label: String(n),
                  }))}
                  onChange={setWinTarget}
                />
                <p className="settings__hint">{t.settings.winTargetHint}</p>
              </div>
              {cameraMode === 'single' && (
                <div className="settings__field">
                  <span className="settings__label settings__label--block">
                    {t.settings.cpuDifficulty}
                  </span>
                  <SegmentedOptions
                    idPrefix={`${idPrefix}-cpu`}
                    ariaLabel={t.settings.cpuDifficulty}
                    value={cpuDifficulty}
                    options={CPU_LEVELS.map((level) => ({
                      value: level,
                      label: cpuLevelLabels[level],
                    }))}
                    onChange={setCpuDifficulty}
                  />
                  <p className="settings__hint">
                    {cpuDifficulty === 1
                      ? t.settings.cpuLevel1Hint
                      : cpuDifficulty === 2
                        ? t.settings.cpuLevel2Hint
                        : t.settings.cpuLevel3Hint}
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {tab === 'camera' && (
          <CameraPrefsFields playerId={1} idPrefix={`${idPrefix}-cam-p1`} />
        )}
        {tab === 'cameraP1' && (
          <CameraPrefsFields playerId={1} idPrefix={`${idPrefix}-cam-p1`} />
        )}
        {tab === 'cameraP2' && (
          <CameraPrefsFields playerId={2} idPrefix={`${idPrefix}-cam-p2`} />
        )}
      </div>
    </>
  )
}
