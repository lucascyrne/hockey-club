import { CAMERA_PREF_RANGES } from '../../../constants/camera'
import { useTranslation } from '../../../i18n'
import { useSettingsStore } from '../../../stores/settingsStore'
import type { PlayerId } from '../../../stores/gameStore'
import { ParamSlider } from './SettingsControls'

type CameraPrefsFieldsProps = {
  playerId: PlayerId
  idPrefix: string
}

export function CameraPrefsFields({ playerId, idPrefix }: CameraPrefsFieldsProps) {
  const { t } = useTranslation()
  const prefs = useSettingsStore((s) =>
    playerId === 1 ? s.cameraP1 : s.cameraP2,
  )
  const setCamera = useSettingsStore((s) => s.setCamera)
  const resetCamera = useSettingsStore((s) => s.resetCamera)

  return (
    <div className="settings__section">
      <ParamSlider
        id={`${idPrefix}-behind`}
        label={t.settings.cameraBehind}
        value={prefs.behindGoal}
        min={CAMERA_PREF_RANGES.behindGoal.min}
        max={CAMERA_PREF_RANGES.behindGoal.max}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(behindGoal) => setCamera(playerId, { behindGoal })}
      />
      <ParamSlider
        id={`${idPrefix}-elev`}
        label={t.settings.cameraElevation}
        value={prefs.elevationDeg}
        min={CAMERA_PREF_RANGES.elevationDeg.min}
        max={CAMERA_PREF_RANGES.elevationDeg.max}
        step={1}
        format={(v) => `${Math.round(v)}°`}
        onChange={(elevationDeg) => setCamera(playerId, { elevationDeg })}
      />
      <ParamSlider
        id={`${idPrefix}-look`}
        label={t.settings.cameraLookAt}
        value={prefs.lookAtX}
        min={CAMERA_PREF_RANGES.lookAtX.min}
        max={CAMERA_PREF_RANGES.lookAtX.max}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(lookAtX) => setCamera(playerId, { lookAtX })}
      />
      <ParamSlider
        id={`${idPrefix}-fov`}
        label={t.settings.cameraFov}
        value={prefs.fov}
        min={CAMERA_PREF_RANGES.fov.min}
        max={CAMERA_PREF_RANGES.fov.max}
        step={1}
        format={(v) => `${Math.round(v)}°`}
        onChange={(fov) => setCamera(playerId, { fov })}
      />
      <button
        type="button"
        className="settings__btn settings__btn--secondary"
        onClick={() => resetCamera(playerId)}
      >
        {t.settings.cameraReset}
      </button>
    </div>
  )
}
