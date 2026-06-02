# Hockey Table

MVP de **air hockey 3D** arcade neon — React Three Fiber + Rapier.

**Visual:** paleta centralizada em [`src/theme/palette.ts`](src/theme/palette.ts) (fundo synthwave, néon ciano/rosa/dourado); fontes **Orbitron** (display) e **Chakra Petch** (UI); ambiente reativo a impactos e gols (`ArenaBackdrop` + `arenaFxStore`).

## Status

**MVP completo (P0–P4)** — menu inicial, modos de jogo, câmeras por modo, HUD arcade.

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` — escolha o modo no **menu inicial**.

## Landing (menu)

O menu exibe um **hero 3D** ao fundo: partida simulada **CPU × CPU** com gols e saques em loop. A câmera alterna entre uma **órbita ampla** e a **visão atrás do gol do P1**. O canvas não captura o mouse — os botões do menu permanecem clicáveis. Ao iniciar uma partida, o hero é desmontado e o jogo real começa com estado limpo.

## Modos de jogo

| Modo | Descrição |
|------|-----------|
| **vs CPU** | Câmera atrás do seu gol (+X); CPU defende o gol oposto |
| **Dois jogadores** | Tela dividida (esq. = P1, dir. = P2); câmera atrás do gol de cada lado |
| **Online** | 1v1 por código de sala · servidor autoritativo 60 Hz · ver [`docs/09-online-multiplayer.md`](docs/09-online-multiplayer.md) |

## Controles

**Padrão em todos os modos:** mover o mouse sobre a mesa (ou sobre a metade da tela no 2P). WASD e setas são opcionais.

### vs CPU
| Ação | Entrada |
|------|---------|
| Raquete | **Mouse** na mesa (WASD opcional: W/S profundidade, A/D lateral) |
| Saque lateral | Espaço |
| Reiniciar partida | R ou botão **Recomeçar** após vitória |
| Voltar ao menu | Botão **Menu** no HUD |

### Dois jogadores (split lateral)
| Jogador | Controle principal | Teclado opcional |
|---------|-------------------|------------------|
| P1 (metade esquerda) | **Mouse** na metade esquerda | WASD |
| P2 (metade direita) | **Mouse** na metade direita | Setas |

### Desenvolvimento
- Painel **Leva**: modo de câmera `game` (padrão) / `orbit` / `leva`
- **r3f-perf** e colliders Rapier debug só em `npm run dev`

### Produção
- Sem Leva, sem painel de diagnóstico pesado
- **FPS** discreto no canto inferior direito

## Idiomas

Interface em **português**, **inglês**, **espanhol** e **chinês simplificado**. O seletor (ícone de globo) fica no canto superior direito no menu e na partida; também em **Configurações**. A preferência é guardada no browser. Traduções em [`src/i18n/locales/`](src/i18n/locales/).

## Áudio e configurações

- **Configurações** no menu principal: volume geral, música (BGM) e efeitos (SFX), com preferências guardadas no browser.
- Coloque ficheiros em [`public/audio/`](public/audio/README.md) (OGG recomendado; MP3 como fallback). Até lá, o jogo funciona sem som.
- BGM: loop no menu e na partida. SFX: impacto na raquete, gol, vitória e saque.
- A demo 3D do menu não reproduz SFX de partida (só BGM do menu, se existir).

## Regras

- Gols nas pontas **±X**; primeiro a **7** vence
- Pausa de 1,5 s após cada gol; saque lateral com ângulo aleatório

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build de produção |
| `npm run typecheck` | TypeScript |
| `npm run preview` | Preview do build |

## Mobile

Portrait: 2P com split **horizontal** (frente a frente); landscape/desktop: split **lateral**. Multitouch no 2P. Detalhes em [`docs/08-mobile.md`](docs/08-mobile.md).

## Deploy (Vercel) e iframe no portfólio

Build: `npm run build` → pasta `dist`. Configuração em [`vercel.json`](./vercel.json).

Para incorporar em [horizonte.dev.br](https://horizonte.dev.br), ver [`docs/embedding.md`](./docs/embedding.md) (headers `frame-ancestors` e exemplo de `<iframe>`).

## Documentação

- [docs/PLANNING.md](./docs/PLANNING.md)
- [docs/06-game-design.md](./docs/06-game-design.md)
- [docs/07-roadmap.md](./docs/07-roadmap.md)
- [docs/08-mobile.md](./docs/08-mobile.md)

## Stack

React 19 · Vite · TypeScript · Three.js · R3F · Rapier · Zustand
