import { describe, expect, it } from 'vitest'
import { runDefenseSuite, runFullDefenseHarness } from './defenseHarness'

describe('defenseHarness', () => {
  it('single bank — nível 3 classifica todos os cenários', () => {
    const m = runDefenseSuite('singleBank', 200, 3)
    expect(m.defended + m.goalsConceded + m.ownGoals).toBeLessThanOrEqual(200)
    expect(m.total).toBe(200)
    expect(m.ownGoals).toBeLessThan(m.total * 0.15)
  })

  it('suite completa executa 5 cenários incluindo remoteBank', () => {
    const all = runFullDefenseHarness(50)
    expect(all).toHaveLength(5)
    expect(all.every((r) => r.total === 50)).toBe(true)
    const remote = all.find((r) => r.scenario === 'remoteBank')
    expect(remote).toBeDefined()
  })
})
