import { useEffect, useState } from 'react'
import { useTranslation } from '../../i18n'
import { useOnlineLobbyWs } from '../../hooks/useOnlineLobby'
import { useOnlineStore } from '../../stores/onlineStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { getWsUrl } from '../../lib/wsUrl'
import { ROOM_CODE_LEN } from '../../../shared/protocol'
import { copyToClipboard } from '../../lib/copyToClipboard'
import { LanguageSwitcher } from './LanguageSwitcher'
import '../../styles/online-lobby.css'

function readJoinCodeFromUrl(): string {
  const params = new URLSearchParams(window.location.search)
  return params.get('join')?.trim().toUpperCase() ?? ''
}

export function OnlineLobby() {
  const { t } = useTranslation()
  const enterMenu = useSessionStore((s) => s.enterMenu)
  const { createRoom, joinRoom, startMatch, leaveRoom } = useOnlineLobbyWs()

  const status = useOnlineStore((s) => s.status)
  const roomCode = useOnlineStore((s) => s.roomCode)
  const role = useOnlineStore((s) => s.role)
  const peerJoined = useOnlineStore((s) => s.peerJoined)
  const errorCode = useOnlineStore((s) => s.errorCode)
  const winTarget = useSettingsStore((s) => s.winTarget)

  const [joinInput, setJoinInput] = useState(readJoinCodeFromUrl)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [mode, setMode] = useState<'pick' | 'join'>(readJoinCodeFromUrl() ? 'join' : 'pick')

  const wsMissing = !getWsUrl()

  useEffect(() => {
    if (joinInput.length === ROOM_CODE_LEN && !roomCode && !wsMissing) {
      joinRoom(joinInput)
    }
  }, [joinInput, roomCode, joinRoom, wsMissing])

  const errorText =
    errorCode === 'ws_missing'
      ? t.online.wsMissing
      : errorCode === 'room_full'
        ? t.online.roomFull
        : errorCode === 'invalid_code' || errorCode === 'room_not_found'
          ? t.online.invalidCode
          : errorCode === 'already_in_room'
            ? t.online.alreadyInRoom
            : errorCode
              ? t.online.connectError
              : null

  const canJoin = joinInput.length === ROOM_CODE_LEN && !wsMissing

  const copyRoomCode = async () => {
    if (!roomCode) return
    const ok = await copyToClipboard(roomCode)
    if (ok) {
      setCopiedCode(true)
      window.setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const copyInviteLink = async () => {
    if (!roomCode) return
    const url = `${window.location.origin}${window.location.pathname}?join=${roomCode}`
    const ok = await copyToClipboard(url)
    if (ok) {
      setCopiedLink(true)
      window.setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const onBack = () => {
    leaveRoom()
    enterMenu()
  }

  return (
    <div className="online-lobby">
      <div className="online-lobby__toolbar ui-toolbar">
        <LanguageSwitcher />
      </div>

      <div className="online-lobby__inner">
        <h1 className="online-lobby__title">{t.online.title}</h1>

        {wsMissing && <p className="online-lobby__error">{t.online.wsMissing}</p>}
        {errorText && <p className="online-lobby__error">{errorText}</p>}
        {status === 'connecting' && (
          <p className="online-lobby__hint">{t.online.connecting}</p>
        )}

        {!roomCode && mode === 'pick' && !wsMissing && (
          <div className="online-lobby__actions">
            <button
              type="button"
              className="mode-card mode-card--primary"
              disabled={wsMissing || status === 'connecting'}
              onClick={createRoom}
            >
              <span className="mode-card__label">{t.online.create}</span>
            </button>
            <button
              type="button"
              className="mode-card"
              onClick={() => setMode('join')}
            >
              <span className="mode-card__label">{t.online.join}</span>
            </button>
          </div>
        )}

        {!roomCode && mode === 'join' && (
          <div className="online-lobby__join">
            <label className="online-lobby__label" htmlFor="room-code">
              {t.online.codeLabel}
            </label>
            <input
              id="room-code"
              className="online-lobby__input"
              value={joinInput}
              onChange={(e) =>
                setJoinInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, ROOM_CODE_LEN))
              }
              placeholder={t.online.codePlaceholder}
              maxLength={ROOM_CODE_LEN}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="mode-card mode-card--primary"
              disabled={!canJoin}
              onClick={() => joinRoom(joinInput)}
            >
              {t.online.join}
            </button>
          </div>
        )}

        {roomCode && (
          <div className="online-lobby__room">
            <p className="online-lobby__role">
              {role === 1 ? t.online.youAreHost : t.online.youAreGuest}
            </p>
            <p className="online-lobby__code" aria-label={t.online.codeLabel}>
              {roomCode}
            </p>
            <div className="online-lobby__copy-row">
              <button
                type="button"
                className="online-lobby__copy"
                onClick={() => void copyRoomCode()}
              >
                {copiedCode ? t.online.copied : t.online.copyCode}
              </button>
              <button
                type="button"
                className="online-lobby__copy online-lobby__copy--secondary"
                onClick={() => void copyInviteLink()}
              >
                {copiedLink ? t.online.copied : t.online.copyLink}
              </button>
            </div>
            <p className="online-lobby__hint">
              {peerJoined ? t.online.peerJoined : t.online.waitingPeer}
            </p>
            {role === 1 && (
              <button
                type="button"
                className="mode-card mode-card--primary"
                disabled={!peerJoined}
                onClick={() => startMatch(winTarget)}
              >
                {t.online.startMatch}
              </button>
            )}
          </div>
        )}

        <button type="button" className="online-lobby__back" onClick={onBack}>
          {t.online.back}
        </button>
      </div>
    </div>
  )
}
