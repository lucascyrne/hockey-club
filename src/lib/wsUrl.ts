/** URL do servidor WebSocket (lobby + relay). */
export function getWsUrl(): string {
  const env = import.meta.env.VITE_WS_URL?.trim()
  if (env) return env

  if (import.meta.env.DEV) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/ws`
  }

  return ''
}
