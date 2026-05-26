# Convenções de Código

## Naming

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes React | PascalCase | `Puck`, `GameCanvas` |
| Hooks | camelCase com `use` | `useKeyboardPaddle` |
| Stores | `useXStore` | `useGameStore` |
| Constantes | UPPER_SNAKE | `TABLE_WIDTH` |
| Arquivos de sistema | camelCase | `rules.ts` |

## Regras R3F (obrigatórias)

1. **Proibido** `setState` / `store.set` dentro de `useFrame`.
2. Animações contínuas via `ref` + `delta` ou `RigidBody` API.
3. Evitar arrays/objetos inline em JSX — constantes ou `useMemo` com deps mínimas.
4. `useGLTF.preload()` para assets usados na partida.
5. Coliders: `ball` (disco), `cuboid` (paredes, raquete); nunca `trimesh` no MVP.
6. Leva: `hidden={import.meta.env.PROD}`.

## Zustand

```typescript
// BOM — selector
const score = useGameStore((s) => s.scoreP1);

// RUIM — store inteiro
const store = useGameStore();
```

Estado contínuo (posição do disco): preferir `useGameStore.getState()` em callbacks de colisão ou leitura pontual — não subscrever o Canvas inteiro.

## Estrutura de componente 3D

- Um arquivo por entidade jogável (`Puck.tsx`, `Paddle.tsx`).
- Props estáveis; `memo()` em modelos GLB caros.
- `forwardRef` quando o pai precisa do mesh/body.

## Checklist de PR

- [ ] FPS ≥ 55 em partida de teste (desktop)
- [ ] Draw calls < 100 (`renderer.info.render.calls`)
- [ ] Sem `setState` em `useFrame` (grep)
- [ ] Novos assets documentados em `03-assets-pipeline.md`
- [ ] Parâmetros de física alterados refletidos em `04-physics-tuning.md`

## Commits (sugestão)

- `feat:` funcionalidade
- `fix:` bug (tunneling, gol fantasma)
- `perf:` otimização medida
- `docs:` documentação
- `chore:` deps, tooling
