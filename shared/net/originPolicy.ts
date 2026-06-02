/** Origens permitidas no handshake WebSocket. */

function normalizeOriginUrl(s: string): string {
  const t = s.trim()
  return t.endsWith('/') ? t.slice(0, -1) : t
}

function isPrivateOrLocalHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true
  if (hostname.startsWith('192.168.')) return true
  if (hostname.startsWith('10.')) return true
  return /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
}

export function parseAllowedOrigins(env?: string): string[] {
  const raw = env ?? process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173'
  if (raw.trim() === '*') return ['*']
  return raw.split(',').map(normalizeOriginUrl).filter(Boolean)
}

export function isOriginAllowed(
  origin: string | undefined,
  allowed: string[],
  allowLanInDev = true,
): boolean {
  if (!origin) return true
  if (allowed.includes('*')) return true

  const normalized = normalizeOriginUrl(origin)
  if (allowed.some((o) => normalized === o || normalized.startsWith(o))) {
    return true
  }

  if (allowed.some((o) => o.includes('vercel.app'))) {
    try {
      const { hostname } = new URL(normalized)
      if (hostname.endsWith('.vercel.app')) return true
    } catch {
      /* ignore */
    }
  }

  if (!allowLanInDev) return false

  try {
    const { hostname, protocol } = new URL(normalized)
    if (protocol !== 'http:' && protocol !== 'https:') return false
    return isPrivateOrLocalHost(hostname)
  } catch {
    return false
  }
}
