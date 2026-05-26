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
