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
})
