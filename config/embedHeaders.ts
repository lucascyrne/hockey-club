import embed from './embed.json'

/** CSP `frame-ancestors` — permite iframe em horizonte.dev.br e abertura direta (`self`). */
export function buildFrameAncestorsCsp(includeDevOrigins = false): string {
  const origins = [...embed.frameAncestors]
  if (includeDevOrigins) {
    origins.push(...embed.frameAncestorsDev)
  }
  return `frame-ancestors ${origins.join(' ')}`
}
