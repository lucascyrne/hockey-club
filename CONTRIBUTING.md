# Contribuindo — Hockey Table

## Pré-requisitos

- Node.js 20+
- npm 10+

## Setup (após scaffold — ver `docs/PLANNING.md` seção I)

```bash
npm install
npm run dev
```

Abrir `http://localhost:5173`.

## Estrutura

- `docs/` — planejamento, física, performance, roadmap
- `src/` — código (criado na implementação)
- `public/models/` — GLB (fase P4+)

## Fluxo de trabalho

1. Identificar fase em `docs/07-roadmap.md`
2. Implementar apenas o escopo da fase
3. Validar DoD da fase antes de avançar
4. Atualizar docs se mudar física, assets ou arquitetura

## Scripts

| Script | Uso |
|--------|-----|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build produção |
| `npm run typecheck` | Verificação TypeScript |
| `npm run preview` | Preview do build |

## Debug

- **Leva:** painel de tuning em desenvolvimento
- **Rapier debug:** prop `debug` em `<Physics>` (somente dev)
- **r3f-perf:** overlay de FPS e draw calls

## Checklist antes de PR

Ver `docs/02-conventions.md` e checklist de 10 itens em `docs/PLANNING.md`.
