# Game Design — Air Hockey MVP

## Fluxo e modos

1. **Menu inicial** — hero 3D em loop (CPU × CPU, sem input); CTAs por cima. Escolha: vs CPU, dois jogadores ou online (desabilitado). Ao sair do menu, a demo para e o `gameStore` é resetado.
2. **vs CPU** — câmera fixa atrás do gol do P1 (+X); mouse/WASD; CPU no P2.
3. **2P local** — split adaptativo: **horizontal** em portrait (P1 embaixo / P2 em cima, frente a frente) ou **lateral** em landscape (P1 esq. / P2 dir.); `SplitScreenRenderer` + multitouch (`PointerSession`); WASD/setas opcionais no desktop.
4. **Online** (futuro) — mesma câmera que vs CPU, lado conforme `localPlayerId` da sessão.

## Dimensões e layout

```
    P2 (gol)          linha central          P1 (gol)
    X = -1.0              X = 0              X = +1.0
         ●──────────────────┼──────────────────●
         │                  ○                  │
         │              (disco)               │
         └────────────────────────────────────┘
              Z: -0.5 ───────── +0.5
```

- Mesa 2 m (eixo **X** = comprimento) × 1 m (eixo **Z** = largura)
- Raquete P1: metade **+X** (não cruza `X < 0.06`)
- Raquete P2/CPU: metade **-X** (não cruza `X > -0.06`)
- Lateral: `Z` em ±0.41 m
- Após gol: saque lateral no centro (`X=0`, `Z=±lateral`) com impulso para dentro e ângulo aleatório para um dos lados

## Regras

| Regra              | Valor                                           |
| ------------------ | ----------------------------------------------- |
| Pontos para vencer | 7                                               |
| Gol                | Disco cruza sensor na linha de fundo adversária |
| Após gol           | `phase: goal` (SFX/FX/HUD); raquetes seguem ativas; disco na calha (~400 ms) → relançamento pelo **centro** → `playing` |
| Ar da mesa         | Configurações: `airLevel` 0–1 (1 = atual; 0 ≈ 25% do teto máx. de velocidade) |
| Manete             | `paddleSpeedP1` / `paddleSpeedP2` 0–1 (1 = atual) |
| Câmera             | `cameraP1` / `cameraP2` persistidos; painel in-game (menu ☰) com preview em tempo real |
| Saída lateral      | Disco rebate na parede (não sai da mesa)        |
| Vitória            | Configurações: **3, 5 ou 7** pontos (`winTarget`); aplica ao iniciar/reiniciar partida |

## CPU (vs CPU — 3 níveis)

Configuração `cpuDifficulty` (1–3), persistida. Nível **3** = comportamento original.

| Nível | Nome (PT) | Comportamento resumido |
| ----- | --------- | ---------------------- |
| 1 | Ensino | Reação ~400 ms, velocidade ~42%, defesa forte, dwell 0,8–2,2 s no campo da CPU, `hitStrength` ~0,55 |
| 2 | Tática | Reação ~200 ms, pausas 0,4–1,1 s; modo ataque/defesa conforme velocidade e posição do disco |
| 3 | Desafio | Reação 80 ms, lead 0,1 s, velocidade 70%, erro ±0,03 m (MVP) |

Implementação: pacote `src/ai/` (Sense→Think→Plan→Act), defesa **goal-first** (`goalPath`, `goalDefense`, `safety`), perfis em `lib/cpuDifficulty.ts`. Debug dev: Leva **CPU Debug** + overlay 3D. Regressão: `npm run sim:defense`.

Não usar pathfinding; movimento direto no plano XZ com clamp.

## Feel targets

| Sensação  | Implementação                                     |
| --------- | ------------------------------------------------- |
| Slide     | friction baixo, damping moderado                  |
| Snappy    | resposta imediata da raquete ao input             |
| Impacto   | restitution alta + impulso da raquete             |
| Controle  | clamp de velocidade do disco                      |
| Fair play | CPU não ler input do jogador — só estado do disco |

## Parâmetros de jogabilidade (inicial)

| Parâmetro                      | Valor  |
| ------------------------------ | ------ |
| MAX_PUCK_SPEED                 | 12 m/s |
| MAX_PADDLE_SPEED               | 8 m/s  |
| transferFactor (raquete→disco) | 0.6    |
| pauseAfterGoal                 | 1.5 s  |
| winTarget (default)            | 7 (opções 3 / 5 / 7 nas configurações) |

## Input

| Modo     | Padrão                                                        | Opcional     |
| -------- | ------------------------------------------------------------- | ------------ |
| vs CPU   | Toque ou mouse no canvas                                      | WASD         |
| 2P local | Toque/mouse na metade do jogador (layout conforme orientação) | WASD / setas |

Raycast usa a câmera de gol do jogador; NDC por viewport (`splitViewport.ts`). Em 2P, cada `pointerId` controla um jogador.

## Mobile

Ver [`08-mobile.md`](./08-mobile.md) — câmera `mobileVsCpu` / `mobile2p`, `GameHudDrawer`, placar horizontal no topo (vs CPU) e `split` dupla-face no 2P, split horizontal em portrait, safe-area e menu sem hero 3D em `pointer: coarse`.

## Demo do menu (hero)

| Aspecto     | Comportamento                                                                           |
| ----------- | --------------------------------------------------------------------------------------- |
| Jogadores   | Duas CPUs (`useDemoDualCpu`); perseguem disco parado na zona neutra                     |
| Início      | Saque lateral garantido após `Puck` registrar ações (evita disco parado no centro)      |
| Stall       | Se velocidade XZ &lt; `DEMO_STALL_SPEED` por ~1,1 s em `playing`, novo saque automático |
| Gols        | Loop infinito — sem `gameOver`; pausa ~0,4 s (`DEMO_GOAL_PAUSE_MS`) → saque             |
| Câmera      | Órbita ampla (~14 s) → transição (~2 s) → visão P1 (~10 s) → transição (~2 s)           |
| Input       | Nenhum (teclas R/Espaço ignoradas no menu)                                              |
| Performance | Sem sombras no hero; DPR limitado; um único Canvas por vez (`screen`)                   |

## Internacionalização (i18n)

| Idioma      | Código | Onde mudar                               |
| ----------- | ------ | ---------------------------------------- |
| Português   | `pt`   | Globo (canto sup. dir.) ou Configurações |
| English     | `en`   | Idem                                     |
| Español     | `es`   | Idem                                     |
| 中文 (简体) | `zh`   | Idem                                     |

- Persistência: `localStorage` (`hockey-table-locale`).
- Primeira visita: deteção via `navigator.language`.
- Ficheiros: `src/i18n/locales/{pt,en,es,zh}.ts` — chaves tipadas com `Translations`.
- `html[lang]` atualizado (`pt-BR`, `en`, `es`, `zh-CN`).

## Áudio

| Camada          | Função                                        |
| --------------- | --------------------------------------------- |
| `settingsStore` | Volumes e mute; persistência `localStorage`   |
| `audioEngine`   | Howler.js — SFX (pool) e BGM (fade)           |
| `AudioHost`     | BGM por `screen`; gol/vitória na partida real |
| `public/audio/` | Assets OGG/MP3 — ver README na pasta          |

Eventos SFX (partida real): colisão raquete–disco, gol, vitória, saque. Demo do hero: sem SFX de jogo.

## UX

- **Menu arcade neon** com mesa 3D animada ao fundo antes da partida
- **Configurações** (modal): sliders de volume e mute
- **HUD in-game** overlay: placar central, banners `GOL!` / vitória, **Recomeçar** no game over, botão Menu, FPS discreto
- Tecla `R` — reiniciar partida na mesma sessão (equivalente a Recomeçar)
- Botão **Menu** — encerra partida e volta ao menu inicial

## Identidade visual

Tom **arcade anos 90 / synthwave leve**: polígonos suaves no 3D, UI com tipografia display e scanlines subtis no overlay HTML.

| Elemento        | Detalhe                                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| Paleta única    | [`src/theme/palette.ts`](../src/theme/palette.ts) → `COLORS` (3D) e [`tokens.css`](../src/styles/tokens.css) (UI) |
| Fundo           | `#070612` → `#12082a`; néon ciano `#00f0ff`                                                                       |
| Jogadores       | P1 `#ff3d8a`, P2/CPU `#ffbf00`, disco `#ffe600`                                                                   |
| Fontes          | **Orbitron** (títulos/placar), **Chakra Petch** (UI)                                                              |
| Ambiente        | `ArenaBackdrop` + `arenaFxStore` — pulse em impacto, flash em gol; faixas LED da mesa reagem ao pulse             |
| Mesa            | Cabinet (skirt + LED inferior), aberturas visuais de gol, furos de ar, logo chapada                               |
| Raquete / disco | Mallet (cabeça + torus + haste estética) e puck com anel superior; **colliders inalterados**                      |

Iluminação unificada em `SceneLighting` (`variant: 'match' | 'hero'`). Hero do menu usa backdrop estático (sem decay de FX) para FPS.

## Referências visuais

- Estilo **arcade neon** (padrão MVP): fundo escuro, mesa azul-elétrico, bordas emissivas leves
- Alternativa futura: madeira/plástico realista (pós-MVP)
