import { describe, expect, it } from 'vitest'
import { isOriginAllowed, parseAllowedOrigins } from '../../shared/net/originPolicy'

describe('originPolicy', () => {
  it('aceita origens explícitas', () => {
    const allowed = parseAllowedOrigins('http://localhost:5173,https://app.example.com')
    expect(isOriginAllowed('http://localhost:5173', allowed, false)).toBe(true)
    expect(isOriginAllowed('https://app.example.com', allowed, false)).toBe(true)
    expect(isOriginAllowed('https://evil.com', allowed, false)).toBe(false)
  })

  it('permite LAN privada quando allowLanInDev', () => {
    const allowed = parseAllowedOrigins('http://localhost:5173')
    expect(isOriginAllowed('http://192.168.0.42:5173', allowed, true)).toBe(true)
    expect(isOriginAllowed('http://192.168.0.42:5173', allowed, false)).toBe(false)
  })

  it('wildcard permite qualquer origem', () => {
    const allowed = parseAllowedOrigins('*')
    expect(isOriginAllowed('https://any.host', allowed, false)).toBe(true)
  })

  it('lê ALLOWED_ORIGINS do ambiente quando o argumento é omitido', () => {
    const prev = process.env.ALLOWED_ORIGINS
    process.env.ALLOWED_ORIGINS = 'https://hockey-club-bay.vercel.app,http://localhost:5173'
    try {
      expect(parseAllowedOrigins()).toEqual([
        'https://hockey-club-bay.vercel.app',
        'http://localhost:5173',
      ])
    } finally {
      if (prev === undefined) delete process.env.ALLOWED_ORIGINS
      else process.env.ALLOWED_ORIGINS = prev
    }
  })

  it('preview Vercel quando produção está na lista', () => {
    const allowed = parseAllowedOrigins('https://hockey-club-bay.vercel.app')
    expect(
      isOriginAllowed('https://hockey-club-bay-git-main-user.vercel.app', allowed, false),
    ).toBe(true)
  })
})
