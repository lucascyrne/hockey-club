# AGENTS.md — Hockey Table

Instruções para agentes de IA (Cursor, etc.) trabalhando neste repositório.

## Contexto

MVP de **air hockey 3D** com React + Vite + TypeScript + React Three Fiber + Rapier.  
Planejamento completo em `docs/PLANNING.md` e `docs/00-vision.md` … `07-roadmap.md`.

## Regras críticas (nunca violar)

1. **Não** usar `setState` ou `zustand.set` dentro de `useFrame`.
2. **Não** usar colliders `trimesh` / `hull` na física do MVP — apenas `ball` e `cuboid`.
3. **Não** colocar estado de posição 3D contínua no Zustand com subscrição no Canvas.
4. **Não** adicionar multiplayer, WebGPU ou post-processing pesado sem pedido explícito.
5. **Não** expandir escopo além da fase atual do roadmap (`docs/07-roadmap.md`).

## Padrões obrigatórios

- Mesa no plano **XZ**, **Y up**, escala **1 unit = 1 m**, mesa **2×1 m**.
- Timestep físico fixo **1/60 s**.
- HUD em DOM React fora do hot path; Zustand com **selectors**.
- Leva oculto em produção.
- Medir FPS e draw calls antes de otimizar visual.

## Ao implementar

1. Ler a fase atual em `docs/07-roadmap.md` e respeitar o DoD.
2. Alterou física → atualizar `docs/04-physics-tuning.md`.
3. Alterou assets → atualizar `docs/03-assets-pipeline.md`.
4. Novos componentes 3D → seguir estrutura em `docs/01-architecture.md`.
5. Preferir primitivos até P4; GLB só se DoD da fase permitir.

## Ao revisar código

```bash
# Buscar violações comuns
rg "setState|\.set\(" --glob "*.tsx" -g "!**/ui/**"
rg "useFrame" -A5 --glob "*.tsx"
```

## Comandos úteis

```bash
npm run dev
npm run typecheck
npm run build
```

## Idioma

Documentação e commits em **português** (descrições); identificadores de código em **inglês**.
