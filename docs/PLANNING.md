# Planejamento — MVP Air Hockey 3D

Documento mestre do planejamento. Detalhes por domínio estão em `00-vision.md` … `07-roadmap.md`.

**Status:** MVP implementado (P0–P4).  
**Modo padrão:** 1P vs CPU | **Estilo visual:** Arcade neon  
**Data:** 2026-05-22

---

## A. Visão e escopo

### MVP vs backlog pós-MVP

| Item | MVP | Pós-MVP |
|------|-----|---------|
| Mesa 3D + bordas | ✅ Primitivos ou GLB leve | GLB detalhado, texturas PBR |
| Disco + física Rapier | ✅ | Partículas no impacto |
| 2 raquetes + input | ✅ 1P teclado/mouse + CPU | 2P gamepad |
| Gols + placar + vitória (7 pts) | ✅ | Torneio, tempo |
| Câmera arcade fixa | ✅ | Replay, shake |
| Sombras / iluminação básica | ✅ Leve | Baked lightmaps |
| CPU simples | ✅ P4 | Dificuldades, IA avançada |
| Leva (dev) | ✅ | — |
| Multiplayer rede | ❌ | WebRTC / colyseus |
| Spin / Magnus | ❌ | Opcional |
| Post-processing | ❌ | Bloom seletivo |
| WebGPU | ❌ | Avaliar após métricas |
| Áudio | ❌ SFX básico opcional | Trilha + spatial |
| Mobile otimizado | ❌ Best-effort | Touch controls |

### Critérios de aceite mensuráveis

| ID | Critério | Métrica |
|----|----------|---------|
| AC-1 | Performance desktop | ≥ 55 FPS médio, 60 FPS alvo, Chrome última versão |
| AC-2 | Draw calls | < 100 em partida (`renderer.info.render.calls`) |
| AC-3 | Partida completa | 7 pontos → `gameOver` → restart sem reload |
| AC-4 | Colisões | 0 tunneling em 50 impactos raquete-disco em velocidade normal |
| AC-5 | Regras de gol | 100% dos cruzamentos de linha contam 1 gol (sem duplo) |
| AC-6 | Input | Raquete P1 responde em < 2 frames ao movimento |
| AC-7 | CPU | Marca ou defende em partida de 3 min (não estática) |
| AC-8 | Estabilidade | 5 partidas seguidas sem leak de memória visível |
| AC-9 | Documentação | `docs/` completo + README com setup |
| AC-10 | DX | `npm run dev` sobe cena jogável após P4 |

---

## B. Arquitetura

Ver diagrama, pastas, interfaces e ADRs em [`01-architecture.md`](./01-architecture.md).

**Resumo do fluxo:** Input → kinematic paddles → Rapier step → collision events → `systems/rules` → Zustand → HUD DOM.

---

## C. Design de jogo

Ver [`06-game-design.md`](./06-game-design.md).

**Decisões assumidas (sem bloqueio):**
- 1P vs CPU como modo padrão
- Vitória em 7 pontos
- Estilo arcade neon (baixo custo de arte)

---

## D. Cena 3D

### Entidades da cena

| Entidade | Mesh | Luz/Sombra | Física |
|----------|------|------------|--------|
| `TableSurface` | Box 2×1×0.02 | receiveShadow | fixed (opcional) |
| `TableWalls` ×4 | Box fino | cast/receive | fixed cuboid |
| `TableRails` | Visual opcional | — | — |
| `Puck` | Cylinder/Sphere | castShadow | dynamic ball |
| `PaddleP1/P2` | Cylinder | castShadow | kinematic cuboid |
| `GoalSensorZ+/Z-` | Invisível | — | fixed sensor |
| `FloorBackdrop` | Plane grande | — | — |
| `AmbientLight` | — | — | — |
| `DirectionalLight` | — | castShadow | — |
| `Camera` | — | — | — |

### Paleta (arcade neon)

| Elemento | Cor hex | Material |
|----------|---------|----------|
| Superfície mesa | `#0a4d8c` | Standard, roughness 0.4 |
| Bordas | `#00e5ff` | Emissive 0.3 |
| Disco | `#ffffff` | Standard metalness 0.2 |
| Raquete P1 | `#ff2d6a` | Emissive 0.2 |
| Raquete P2/CPU | `#ffd700` | Emissive 0.2 |
| Fundo | `#0d0d12` | Basic ou fog |

### Iluminação

- `ambientLight` intensity 0.4
- `directionalLight` position `[5, 8, 5]`, intensity 1.2, shadow map 1024
- Sem `Environment` HDR no MVP (economia de GPU)
- `fog` opcional `#0d0d12` near 3 far 12

---

## E. Física (Rapier)

Ver tabela completa em [`04-physics-tuning.md`](./04-physics-tuning.md).

---

## F. Roadmap

Ver fases P0–P4 em [`07-roadmap.md`](./07-roadmap.md).

---

## G. Documentação do repositório

| Arquivo | Conteúdo mínimo |
|---------|-----------------|
| `00-vision.md` | Objetivo, não-objetivos, critérios de sucesso |
| `01-architecture.md` | Diagrama, pastas, ADRs, interfaces |
| `02-conventions.md` | Naming, regras R3F, checklist PR |
| `03-assets-pipeline.md` | Escala, dimensões, limites polys |
| `04-physics-tuning.md` | Parâmetros Rapier, anti-tunneling |
| `05-performance.md` | Budget ms, métricas, proibições |
| `06-game-design.md` | Regras, CPU, feel |
| `07-roadmap.md` | P0–P4 com DoD |
| `PLANNING.md` | Este documento (índice mestre) |

**AGENTS.md** — regras para agentes IA (ver raiz do repo).  
**CONTRIBUTING.md** — setup local e scripts.

---

## H. Riscos e mitigação

| # | Risco | Impacto | Mitigação |
|---|-------|---------|-----------|
| R1 | Re-renders React no loop 60fps | Alto | ADR-004; code review grep `setState` em `useFrame` |
| R2 | Tunneling disco × raquete | Alto | kinematic + substeps + clamp velocidade; teste 50 impactos |
| R3 | Escopo de arte atrasa MVP | Médio | P0–P3 só primitivos; GLB opcional em P4 |
| R4 | Tuning de física interminável | Médio | Baseline em `04-physics-tuning.md` + Leva só dev |
| R5 | DX R3F/Rapier íngreme | Médio | `docs/`, AGENTS.md, template de entidade |

---

## I. Setup inicial

### Comandos de scaffold

```bash
npm create vite@latest hockey-table -- --template react-ts
cd hockey-table
npm install three @types/three
npm install @react-three/fiber @react-three/drei @react-three/rapier
npm install zustand leva
npm install -D @types/react @types/react-dom r3f-perf
```

### Versões recomendadas (maio 2026)

| Pacote | Versão | Notas |
|--------|--------|-------|
| `react` | ^19.0.0 | Compatível com R3F atual |
| `react-dom` | ^19.0.0 | — |
| `three` | ^0.175.0 | Ver peer de R3F no install |
| `@react-three/fiber` | ^9.0.0 | Peer dep com three |
| `@react-three/drei` | ^10.0.0 | — |
| `@react-three/rapier` | ^1.4.0 | WASM physics |
| `zustand` | ^5.0.0 | — |
| `leva` | ^0.10.0 | Dev only |
| `typescript` | ^5.7.0 | — |
| `vite` | ^6.0.0 | — |
| `r3f-perf` | ^7.0.0 | Dev only |

> Executar `npm ls three` após install e alinhar versão única de `three` (evitar duplicatas).

### Scripts npm sugeridos

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  }
}
```

---

## Checklist de demo (10 itens)

- [x] **1.** `npm run dev` abre cena com mesa proporcional 2:1
- [x] **2.** FPS ≥ 55 durante partida no desktop (`r3f-perf` em dev)
- [x] **3.** Draw calls < 100 com `renderer.info` ou r3f-perf
- [x] **4.** Disco rebate paredes sem escapar da mesa
- [x] **5.** 50 impactos raquete-disco sem tunneling (velocidade normal)
- [x] **6.** Gol conta 1 ponto; sem duplo trigger no mesmo cruzamento
- [x] **7.** Partida até 7 pontos com `gameOver` e restart (`R`)
- [x] **8.** CPU defende e ocasionalmente contra-ataca (P4)
- [x] **9.** HUD mostra placar correto; Canvas não re-renderiza a cada frame
- [x] **10.** `docs/` e README permitem onboarding em < 30 min

---

## Perguntas em aberto (opcionais — não bloqueiam)

1. **Input P1:** mouse no plano da mesa ou WASD exclusivo?
2. **2P local:** incluir no MVP ou só pós-MVP?
3. **SFX:** um `click` no gol é aceitável no MVP?

*Defaults assumidos: mouse + WASD; 2P como stretch P4; sem áudio no MVP.*
