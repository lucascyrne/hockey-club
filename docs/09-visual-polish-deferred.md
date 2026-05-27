# Polish visual adiado — mesa, rastro e gol contínuo

Documento de referência após tentativa de gabinete procedural + trail 3D. **Não implementar** a abordagem rejeitada abaixo; seguir as alternativas recomendadas.

Ver também: [03-assets-pipeline.md](./03-assets-pipeline.md), [06-game-design.md](./06-game-design.md).

---

## O que falhou e por quê

| Tentativa | Problema |
|-----------|----------|
| Gabinete com vários `box` / painéis inclinados empilhados | Sobreposição, escalas inconsistentes, “manchas” pretas, conflito com `ArenaBackdrop` e emissive |
| Trail 3D (ribbon / `Trail` mal configurado) | Geometria desalinhada ao disco, artefactos visuais, sensação de formas soltas |

**Conclusão:** detalhe de fliperama realista → **asset 3D único (GLB)**. Rastro neon → **sprite 2D (billboard)**, não geometria complexa em runtime.

---

## Estratégia recomendada (ordem)

1. Manter visual atual da superfície em [`Table.tsx`](../src/components/table/Table.tsx) (playfield neon + bordas).
2. Substituir só o **corpo** por `public/models/table.glb` (colliders permanecem em [`TablePhysics.tsx`](../src/components/table/TablePhysics.tsx)).
3. Rastro: textura PNG + quad atrás do disco ([`Puck.tsx`](../src/components/puck/Puck.tsx)).
4. Gol contínuo: lógica em código (sem depender do modelo 3D da calha).

---

## Mesa — GLB

| Item | Especificação |
|------|----------------|
| Formato | glTF 2.0 / GLB |
| Escala | 2,0 m (X) × 1,0 m (Z); origem no **centro da superfície de jogo** |
| Export | Aplicar escala no Blender; `Apply Transforms`; sem colliders de física no ficheiro |
| Triângulos | ~5k–15k (gabinete); total cena &lt; 25k ([03-assets-pipeline.md](./03-assets-pipeline.md)) |
| Materiais | Gabinete matte (baixo emissive); neon só na superfície / decals em código |
| Integração | `useGLTF` + `useGLTF.preload`; grupo visual filho; markings / buracos de ar podem ficar em código |
| Fonte | Blender próprio ou asset licenciado (Sketchfab, etc.) |

**Incremento mínimo sem GLB:** no máximo 4 pernas + saia baixa (cilindros + caixa). Evitar painéis inclinados, gantry e múltiplas caixas soltas.

---

## Rastro — billboard (PNG)

| Item | Especificação |
|------|----------------|
| Asset | `public/textures/puck-streak.png` — traço horizontal, gradiente amarelo → ciano, alpha suave |
| Formato | PNG (não GIF) |
| Tamanho sugerido | 256×64 ou 512×128 px |
| Material | `MeshBasicMaterial`, `transparent`, `depthWrite: false`, `toneMapped: false`, blending aditivo |
| Comportamento | Quad atrás do disco; `rotation.y = atan2(vz, vx)`; `scale.x ∝ speed`; `visible` se `speed > ~0,4 m/s` |
| Desligar | Durante sequência de gol (`inChute` / oculto) ou `gameOver` |

**Evitar:** partículas pesadas, motion blur pós-processo, ribbon com buffer longo, `Trail` drei sem tuning fino.

---

## Gol contínuo (implementado)

| Etapa | Comportamento |
|-------|----------------|
| Deteção | Cruzar linha de gol → `onGoal` + `puckFlow: inChute` |
| Fase | `phase: goal` dispara SFX/FX/HUD; raquetes e CPU **continuam** |
| Disco | Calha ~400 ms (`PUCK_CHUTE_MS`); mesh oculta |
| Relançamento | [`getCenterEjectSpawn()`](../src/systems/puckSpawn.ts) pelo centro → `phase: playing` |

Módulos: [`puckFlowStore.ts`](../src/stores/puckFlowStore.ts), [`puckGoalSequence.ts`](../src/systems/puckGoalSequence.ts), [`Puck.tsx`](../src/components/puck/Puck.tsx).

---

## Checklist QA (quando implementar)

- [ ] GLB centrado; sem flutuar nem cortar câmeras mobile / 2P
- [ ] Colliders inalterados; disco e raquetes comportam-se como antes
- [ ] Streak só com disco em movimento rápido; sem z-fighting na mesa
- [x] Gol: placar sobe; raquetes movem-se; disco reaparece com lançamento pelo centro
- [ ] Sem gol duplo na mesma jogada
- [ ] `npm run typecheck` e `npm run build` OK

---

## Referência rápida de ficheiros

| Futuro | Ficheiro |
|--------|----------|
| Modelo | `public/models/table.glb` |
| Textura rastro | `public/textures/puck-streak.png` |
| Visual mesa | `src/components/table/TableModel.tsx` (novo, opcional) |
| Rastro | `src/components/puck/PuckStreak.tsx` (novo) |
| Fluxo gol | `src/stores/puckFlowStore.ts`, `src/systems/puckGoalSequence.ts` |
