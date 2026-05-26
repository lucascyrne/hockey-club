# Roadmap por Fases

## Visão geral

| Fase | Nome | Duração estimada | Depende de |
|------|------|------------------|------------|
| P0 | Cena estática | 1–2 dias | — |
| P1 | Física disco + paredes | 2–3 dias | P0 |
| P2 | Raquetes + input | 2–3 dias | P1 |
| P3 | Gols + placar + reset | 1–2 dias | P2 |
| P4 | CPU + polish mínimo | 2–3 dias | P3 |

---

## P0 — Cena estática navegável

**Objetivo:** Validar escala, câmera, iluminação e estrutura do projeto.

**Tarefas:**
- Scaffold Vite + React + TS + R3F + drei
- `GameCanvas` com mesa primitiva (2×1 m), bordas, chão
- Câmera perspectiva fixa + `OrbitControls` apenas em dev (Leva)
- Luz ambient + directional + sombras opcionais
- HUD placeholder “Hockey Table MVP”

**Riscos:** Container sem altura → Canvas 0px.

**DoD (Definition of Done):**
- [x] Mesa visível proporcional 2:1
- [x] OrbitControls funciona em dev (modo `orbit` no Leva)
- [x] ≥ 60 FPS em cena vazia
- [x] Leva ajusta FOV e posição da câmera (modo `leva`)

---

## P1 — Física do disco + paredes

**Objetivo:** Disco se move e rebate nas paredes sem tunneling.

**Tarefas:**
- Integrar `@react-three/rapier` com `gravity=[0,0,0]`
- Paredes `fixed` + colliders `cuboid`
- Disco `dynamic` + `ball` collider
- Tampo `fixed` invisível (evitar queda em Y)
- Clamp `MAX_PUCK_SPEED`
- Debug Rapier (`debug` prop) em dev

**Riscos:** Disco escapa pelo eixo Y; damping errado (disco nunca para).

**DoD:**
- [x] Disco lançado rebate 5+ vezes de forma previsível
- [x] Sem queda infinita em Y
- [x] FPS ≥ 55 com física ativa

---

## P2 — Raquetes + input

**Objetivo:** Jogador move raquete e acerta o disco de forma confiável.

**Tarefas:**
- Duas raquetes `kinematicPosition`
- Input P1: mouse no plano XZ ou WASD
- Clamp de área por metade da mesa
- Transferência de momentum no `onCollisionEnter`
- Média móvel de velocidade da raquete (N=8)

**Riscos:** Tunneling disco × raquete; input lag.

**DoD:**
- [x] 20 golpes consecutivos sem atravessar raquete
- [x] Disco ganha velocidade quando raquete se move
- [x] Raquete não sai da metade do campo

---

## P3 — Gols + placar + reset

**Objetivo:** Partida completa com regras e HUD.

**Tarefas:**
- Sensores de gol (`sensor` collider)
- `gameStore`: score, phase, winner
- HUD DOM com placar
- Reset de posições após gol (pausa 1.5 s)
- Vitória em 7 pontos + restart

**Riscos:** Gol fantasma (duplo trigger); estado dessincronizado.

**DoD:**
- [x] Partida até 7 pontos sem bug de placar
- [x] Reset correto após cada gol
- [x] HUD atualiza só em eventos de gol/game over

---

## P4 — CPU + polish mínimo

**Objetivo:** Jogo jogável solo com sensação arcade aceitável.

**Tarefas:**
- [x] IA CPU (defensiva simples) — `systems/cpuPaddle.ts`, `useCpuPaddle`
- [x] Materiais/cores neon básicos — emissive mesa/bordas/disco/raquetes
- [ ] Substituir primitivos por GLB (opcional — não feito; primitivos mantidos)
- [x] `r3f-perf` em dev; ajuste damping/restitution
- [x] README com instruções

**Riscos:** CPU perfeita demais ou inútil; escopo de arte inflar.

**DoD:**
- [x] 1 partida completa 1P vs CPU jogável
- [x] FPS ≥ 55 em desktop (validar com `r3f-perf` em dev)
- [x] Checklist de demo (10 itens) 100% verde — ver `PLANNING.md`

---

## Backlog pós-MVP

Ver tabela em `docs/PLANNING.md` seção A (ou `00-vision.md` não-objetivos).
