# Performance

## Orçamento por frame (60 FPS = 16.67 ms)

| Sistema | Budget | Notas |
|---------|--------|-------|
| React reconciliation | < 1 ms | HUD isolado; Canvas estável |
| Rapier step | < 4 ms | 1 body dinâmico + colliders fixos |
| Three.js render | < 8 ms | Draw calls < 100 |
| Margem / GC | ~ 3 ms | Evitar alocações em `useFrame` |

## Métricas alvo (MVP)

| Métrica | Alvo | Ferramenta |
|---------|------|------------|
| FPS médio | ≥ 55 | `r3f-perf` / Stats |
| Draw calls | < 100 | `gl.info.render.calls` |
| Triângulos | < 50k | `gl.info.render.triangles` |
| Memória GPU | Estável após 5 partidas | Chrome Memory |

## Canvas (configuração recomendada)

```tsx
<Canvas
  dpr={[1, 1.5]}
  shadows="soft"           // desligar se FPS < 50
  gl={{ antialias: true, powerPreference: 'high-performance' }}
  frameloop="always"       // "demand" só em menu estático
/>
```

## Otimizações permitidas no MVP

- Primitivos em vez de GLB pesado
- Uma luz direcional + ambient (sem Environment HDR pesado)
- Sombras 1024² (não 2048)
- Materiais `MeshStandardMaterial` simples
- `memo()` em componentes de mesa estáticos

## Otimizações proibidas até medir gargalo

- Instancing complexo
- Post-processing (bloom, SSAO)
- WebGPU migration
- Merge de geometrias da mesa (ganho marginal no MVP)

## Hot path — proibições

- `new Vector3()` dentro de `useFrame`
- `setState` / `set()` Zustand em `useFrame`
- `console.log` em colisão contínua
- Raycast por frame para input (usar projeção no plano XZ)

## Checklist antes de demo

1. Profile 60 s de partida — anotar FPS mínimo
2. Confirmar draw calls < 100
3. Jogar 3 partidas seguidas — memória estável
4. Testar raquete no limite de velocidade — sem tunneling
