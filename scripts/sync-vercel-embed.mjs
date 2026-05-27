/**
 * Sincroniza frame-ancestors de config/embed.json → vercel.json (única CSP em produção).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const embedPath = join(root, 'config', 'embed.json')
const vercelPath = join(root, 'vercel.json')

const embed = JSON.parse(readFileSync(embedPath, 'utf8'))
const csp = `frame-ancestors ${embed.frameAncestors.join(' ')}`

const vercel = JSON.parse(readFileSync(vercelPath, 'utf8'))
const headersBlock = vercel.headers?.[0]
if (!headersBlock?.headers) {
  console.error('vercel.json: bloco headers não encontrado')
  process.exit(1)
}

const cspHeader = headersBlock.headers.find((h) => h.key === 'Content-Security-Policy')
if (!cspHeader) {
  console.error('vercel.json: Content-Security-Policy não encontrado')
  process.exit(1)
}

cspHeader.value = csp
writeFileSync(vercelPath, `${JSON.stringify(vercel, null, 2)}\n`)
console.log('vercel.json CSP atualizado:', csp)
