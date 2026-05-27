import { useTranslation } from '../../i18n'
import { useOnlineStore } from '../../stores/onlineStore'
import '../../styles/online-lobby.css'

export function OnlineDisconnectOverlay() {
  const { t } = useTranslation()
  const show = useOnlineStore((s) => s.disconnectMessage)

  if (!show) return null

  return (
    <div className="online-lobby__disconnect-overlay" role="alert">
      <p>{t.online.peerLeft}</p>
    </div>
  )
}
