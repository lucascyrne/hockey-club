import { createRequire } from 'module'

const require = createRequire(import.meta.url)

async function main() {
  const { runFullDefenseHarness } = await import('../dist-ai-sim/defenseHarness.js').catch(
    () => null,
  )

  if (!runFullDefenseHarness) {
    console.log('Execute: npm run build:sim && npm run sim:defense')
    console.log('Ou use: npx vitest run src/ai/sim/defenseHarness.test.ts')
    process.exit(0)
  }

  const results = runFullDefenseHarness(250)
  for (const r of results) {
    console.log(
      `${r.scenario}: defended=${r.defended}/${r.total} goals=${r.goalsConceded} ownGoals=${r.ownGoals} marginMs=${r.avgReactionMarginMs.toFixed(0)}`,
    )
  }
}

main()
