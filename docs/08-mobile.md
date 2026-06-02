# Mobile e layout adaptativo

## Modos × layout

| Modo | Portrait (altura > largura) | Landscape touch (tablet) | Landscape desktop (ponteiro fino) |
|------|----------------------------|--------------------------|-----------------------------------|
| vs CPU | Tela cheia, toque em toda a mesa | Idem | Idem |
| 2P local | Split **horizontal** (P1 embaixo, P2 em cima) | Split **horizontal** (igual mobile) | Split **lateral** (P1 esq., P2 dir.) |
| Online | Igual vs CPU (câmera atrás do gol local) | Idem | Idem |

O eixo 2P usa `(pointer: coarse)` em [`resolveSplitAxis`](../src/lib/splitViewport.ts): tablets em landscape mantêm split horizontal e placar central, não o layout lateral do desktop.

## Câmera mobile

Em partidas (`GoalCamera`), quando `layoutStore.isMobile` é verdadeiro, o perfil depende do modo em [`src/constants/camera.ts`](../src/constants/camera.ts):

| Perfil | Modo | Comportamento |
|--------|------|---------------|
| `mobileVsCpu` | vs CPU (e online futuro) | ~1,2 m atrás do gol, elevação ~20°, FOV 56° (mais campo visível) |
| `mobile2p` | 2P local | Leve zoom (~0,86 m), elevação ~28° |

No **2P**, [`ArenaBackdrop`](../src/components/canvas/ArenaBackdrop.tsx) expande chão/paredes para evitar tarja preta no limite do fundo nos viewports split.

No **2P portrait** (split horizontal, altura > largura), a metade do P2 é renderizada com roll 180° e o toque usa NDC invertido (`shouldFlipP2View`), para jogar frente a frente no mesmo telemóvel.

## HUD em partida

| Elemento | Comportamento |
|----------|---------------|
| **Menu ☰** | [`GameHudDrawer`](../src/components/ui/GameHudDrawer.tsx) — painel lateral direito com padding à direita; idioma, dúvidas, voltar ao menu |
| **Placar** | [`Scoreboard`](../src/components/ui/Scoreboard.tsx): `top` (vs CPU); `split` = duas faces no centro da divisão (2P horizontal/tablet, P2 invertido); `dualTop` = placar completo no topo de **cada metade** (2P lateral desktop); `center` reservado para online |
| **Pulso impacto** | `arenaFxStore` → chão/paredes [`ArenaBackdrop`](../src/components/canvas/ArenaBackdrop.tsx), bordas [`Table`](../src/components/table/Table.tsx), vignette CSS `--arena-pulse` no HUD |

Z-index: drawer > placar > linha de divisão > canvas. Placar com `pointer-events: none`.

## Controles

- **vs CPU:** um dedo → raquete P1 (raycast na mesa; NDC tela cheia).
- **2P:** `pointerdown` associa `pointerId` à metade (baixo/topo ou esq./dir.); dois dedos simultâneos.
- Teclado (WASD / setas) permanece opcional no desktop.

## Módulos

| Ficheiro | Função |
|----------|--------|
| [`src/stores/layoutStore.ts`](../src/stores/layoutStore.ts) | `splitAxis`, `isMobile`, `reduceMenuFx` |
| [`src/constants/camera.ts`](../src/constants/camera.ts) | Perfis `default` / `mobileVsCpu` / `mobile2p` |
| [`src/lib/splitViewport.ts`](../src/lib/splitViewport.ts) | Viewports WebGL e NDC por eixo |
| [`src/lib/pointerSession.ts`](../src/lib/pointerSession.ts) | Multitouch 2P |
| [`src/components/layout/LayoutSync.tsx`](../src/components/layout/LayoutSync.tsx) | Atualiza layout no resize |

## Checklist QA manual

- [ ] iOS Safari — vs CPU portrait: gol próprio e metade inferior visíveis; câmera mais afastada
- [ ] iOS Safari — vs CPU: toque move raquete, sem scroll da página
- [ ] iOS Safari — 2P portrait: split horizontal, dois dedos, ambas metades com mesa visível
- [ ] iOS Safari — 2P: placar no centro da divisão legível em cada metade
- [ ] Chrome Android — idem
- [ ] iPad / tablet landscape — 2P: split horizontal (não lateral)
- [ ] Desktop — 2P landscape: split lateral; dois placares no topo de cada metade (`dualTop`)
- [ ] HUD — um botão ☰, sem ícones sobrepostos no topo
- [ ] iframe em horizonte.dev.br — touch OK
- [ ] Menu em telefone: hero 3D + anéis lite (3 anéis); DPR 1 (`reduceMenuFx`)

## Embed

Ver [`embedding.md`](./embedding.md). O portfólio deve permitir `frame-src` para o URL do deploy.
