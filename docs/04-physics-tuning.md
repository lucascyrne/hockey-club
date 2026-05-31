# Física (Rapier)

## RigidBody por entidade

| Entidade | Tipo | Collider | Notas |
|----------|------|----------|-------|
| Mesa / paredes | `fixed` | `cuboid` | 4 paredes + opcional tampo sensor |
| Disco | `dynamic` | `cylinder` (eixo Y) | Único corpo dinâmico principal |
| Raquete P1/P2 | `kinematicPosition` | `cuboid` ou `ball` | Movida por input, não por forças |
| Sensor de gol | `fixed` | `cuboid` `sensor=true` | Sem resposta física; dispara regra |

## Parâmetros iniciais (baseline)

| Parâmetro | Disco | Raquete | Paredes |
|-----------|-------|---------|---------|
| mass | 0.05 kg | — (kinematic) | — |
| restitution | 0.94 | 0.92 (collider) | 0.82 |
| friction | 0.02 | 0.1 | 0.05 |
| linearDamping | 0.18 | — | — |
| angularDamping | 0.45 | — | — |
| max linear speed | 12 m/s (clamp no código) | 8 m/s (velocidade kinematic) | — |

> Valores são ponto de partida; ajustar em Leva e registrar aqui após playtest.

## Configuração do mundo

```typescript
// constants/physics.ts (valores alvo)
PHYSICS_TIMESTEP = 1 / 60;        // s
PHYSICS_SUBSTEPS = 1;             // aumentar para 2 se tunneling persistir
GRAVITY = [0, 0, 0];             // mesa horizontal — sem gravidade real
CCD_ENABLED = true;               // para disco e raquetes se API expuser
```

## Transferência de momentum (raquete → disco)

Pseudocódigo no evento `onCollisionEnter` disco × raquete:

```
paddleVel = média móvel das últimas N posições (N=8, ~133ms @60fps)
impulse = paddleVel * transferFactor   // transferFactor inicial: 0.6
aplicar impulso adicional na direção da normal de contato
clamp velocidade resultante do disco em MAX_PUCK_SPEED
```

Referência: projetos de air hockey usam média móvel para evitar picos de velocidade em um único frame.

## Anti-tunneling

| Estratégia | Prioridade |
|------------|------------|
| Timestep fixo 1/60 | Obrigatório |
| Raquete `kinematicPosition` com movimento limitado por frame | Obrigatório |
| Collider `ball` no disco (não mesh) | Obrigatório |
| `substeps` = 2 no Physics | Se tunneling em testes |
| Reduzir `MAX_PADDLE_SPEED` | Se jogador “bate” muito rápido |
| CCD Rapier (quando disponível na versão) | Habilitar em disco + raquete |

## Sincronização mesh ↔ body

- Disco e raquetes: filhos de `<RigidBody>` — Rapier move o body, R3F sincroniza o mesh.
- **Não** duplicar posição em Zustand para render.
- HUD e regras leem posição apenas em eventos (gol, reset), não a cada frame.

## Reproduzir / corrigir bugs

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| Disco atravessa raquete | Velocidade kinematic alta / poucos substeps | ↑ substeps, ↓ max paddle speed |
| Disco “gruda” na parede | Restitution + damping | ↓ restitution parede para 0.8 |
| Disco nunca para | Damping baixo | ↑ linearDamping para 0.2 |
| Gol não detectado | Sensor mal posicionado | Ajustar Z do sensor ±0.02 m |

## IA CPU — defesa orientada ao gol (2025)

| Parâmetro | Valor / notas |
|-----------|----------------|
| `predictionHorizonS` | 0.12–0.5 por personalidade (`src/ai/config.ts`) |
| `maxBounceReflections` | 0–3; nível 2+ usa ≥1 para tabelas |
| `CPU_THREAT_LEAD_S` | 0.45 s — legado; ameaça usa `traceGoalThreatPath` |
| Anti own-goal | `estimateOwnGoalRisk` threshold 0.42 → fallback boca do gol |
| Debug (dev) | Leva painel **CPU Debug** + overlay 3D (`CpuDebugOverlay`) |

### Modelo defensivo

1. **Goal-first:** `planGoalFirstDefense` bloqueia boca do gol (`goalEntryZ`), não só `puck.z`.
2. **Ameaça:** tiers `LOW` / `MEDIUM` / `HIGH` / `CRITICAL` via entrada prevista no gol após rebotes Z.
3. **FSM:** `intercept` em `tier >= HIGH`; bloqueio de `attack`/`clear` no terço defensivo com `tier >= MEDIUM`.

### Ataque decisivo (2026)

| Parâmetro | Valor / notas |
|-----------|----------------|
| Planner | `planOffensiveStrike` — alvo **através** do disco (`puck.x + overshoot`) em direção ao gol adversário |
| Overshoot | `0.06 + attackAggression * 0.2` (máx. 0.18 m) |
| `hitStrength` dinâmico | `strikeProfile.ts`: `baseHit * (1 + 0.25 * urgency)` em remate; cap 1.35 |
| `urgency` | Liga `speedFactor` no actuador (0.85–1.15×); boost 1.25× perto do disco |
| PROFILE_2 | `hitStrength` 0.9, `attackAggression` 0.5 |

### Defesa remota (disco no campo adversário)

| Comportamento | Implementação |
|---------------|-----------------|
| FSM | `!onOwn` + ameaça MEDIUM ou `goalEntry` → `guard`; senão `track` |
| Planner | `planRemoteDefense` — X em `CPU_DEFENSE_X`, Z em `goalEntryZ` ou lead Z |
| Dwell | Desligado com `tier >= MEDIUM`, `timeToGoal < 0.6 s`, ou disco para o nosso gol |

### CPU estável perto do disco (2026)

| Medida | Valor |
|--------|--------|
| `engageLock` | Alvo fixo ~130 ms quando `dist < 0.22 m` |
| Sweep histerese | Entra &lt; 0.40 m, sai &gt; 0.48 m |
| Actuador | Sem boost 1.25× com `paddle–puck < 2.2× minDist`; lerp ideal α=0.35 |
| Urgency +0.2 | Só se disco atrás da raquete e ainda longe |

### Raquete–disco (anti-tunnel)

| Medida | Detalhe |
|--------|---------|
| `placePuckOnStrikeSide` | Disco atrás da raquete → posição fixa no hemisfério adversário (X) |
| Passos | `runPuckPaddleSafety` em `useBeforePhysicsStep` + `useAfterPhysicsStep` ([`puckPaddleSafety.ts`](src/systems/puckPaddleSafety.ts)) |
| Sanduíche | Duas raquetes perto: resolve primeiro quem tem o disco “atrás” |

### Demo hero (CPU×CPU)

| Medida | Detalhe |
|--------|---------|
| Golo | `phase` mantém `playing`; faceoff lateral imediato (sem calha/`goal`) |
| Stall | Nudge ~1,8 m/s após 0,9 s; faceoff só após 2,5 s ou sanduíche |
| IA | `DEMO_CPU_PROFILE_*` + `demoMode` em `tickCpuPlayer` |

### Cantos chanfrados (~8 cm)

| Parâmetro | Valor |
|-----------|--------|
| `TABLE_CORNER_CHAMFER` | 0.08 m (definido em [`tableCorners.ts`](src/constants/tableCorners.ts)) |
| Layout partilhado | `getCornerChamferLayout(signX, signZ)` — `rotY` por canto (`++` ≈ `π/4`); espessura deslocada para fora do campo |
| Física | 4 `CuboidCollider` com layout de `tableCorners` + laterais/pontas encurtadas |
| `puckBounds` | `applyCornerDiagonalClamp` — meio-plano `signX·x + signZ·z ≤ (hw−c)+(hd−c)` + projeção na diagonal |
| Visual | `CornerChamferRail` (box alinhado ao collider); linha neon no chão usa o mesmo layout; **sem** postes cilíndricos |
| IA | `cornerEscapeTarget` usa `projectToCornerDiagonal` (normal interior) |

### Regressão

```bash
npm run sim:defense   # vitest: goalPath + defenseHarness (+ remoteBank)
npm run sim:offense   # vitest: offenseHarness
npm test              # inclui engageGeometry + puckBounds corner
```

Metas de referência (nível 3, harness geométrico): own goals &lt; 15% contactos; single bank defended &gt; 50% (ajustar após baseline).
