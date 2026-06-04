# Multiplayer online — servidor autoritativo

## Arquitetura

- **Servidor Node** (`server/src`): simulação Rapier a **60 Hz**, salas WebSocket, broadcast `snapshot` via **MsgPack**.
- **Clientes** (iguais): enviam `input` (posição alvo da raquete) a cada frame; renderizam disco e raquete adversária por **interpolação temporal** com `serverTime`.
- **Sem host autoritativo** na física: quem cria a sala só inicia a partida (`start`); o gol e o placar vêm do servidor.

## Protocolo (`shared/protocol.ts`)

| Direção | Mensagem | Notas |
|---------|----------|--------|
| C2S | `input { tick, px, pz }` | `playerId` inferido pelo `role` na sala |
| C2S | `rematch` | Em `gameOver`; quando ambos votam, servidor reinicia a sessão |
| S2C | `snapshot { serverTime, tick, puck, p1, p2, phase, scores, countdownStep, flow }` | ~60/s por sala |
| S2C | `goal { scorer }` | SFX nos clientes |
| S2C | `rematch { ready: [p1, p2] }` | Progresso da revanche |

Wire encoding: `shared/protocolCodec.ts` (MsgPack binário).

## Cliente

- `useOnlineMatch` (MatchShell): handlers WS, RTT e disconnect.
- `OnlineCanvasSync` (Canvas): interpolação por passo de física + envio de `input` (~60 Hz).
- `onlineNetState`: **um escritor por frame** (`stepOnlineInterpolation`); `applySnapshot` só empilha histórico. **Delay 0 ticks** quando RTT ≤ ~5 ms (`interpDelayMs ≤ TICK_MS`); caso contrário buffer de 1–4 ticks. Entre snapshots em LAN, interpolação **sub-frame** entre o par mais recente. **`snapToLatest`** em transições (`held`→`play`, `countdown`→`playing`, `countdownStep`→`puck`) para faceoff visível sem misturar histórico antigo. Não é limitação de infraestrutura em LAN.
- `PhysicsWorld`: em online **não pausa** no countdown (só menu/config); `interpolate={false}` no Rapier (evita dupla suavização com corpos kinematic); poses via `setNextKinematicTranslation`.
- `Puck`: kinematic + sensor; pose de `netPuck`.
- Raquete local: predição em `paddleTargets`; remota: `netPaddle` direto.
- Revanche: ambos clicam Recomeçar → `rematch` → servidor novo `MatchSession` + `match`.

## Paridade física

Colisões, bounds e impulsos disco×raquete vêm de **`shared/sim/`** (mesma lógica que o cliente local offline). O servidor aplica `runPuckPaddleSafety` pós-step e chanfros de canto em `puckBounds`. O cliente online não simula colisões (disco kinematic + sensor); apenas interpola snapshots.

## Servidor local

```bash
npm run dev:server   # raiz — tsx watch server/src/index.ts
# ou
cd server && pnpm run dev
```

`VITE_WS_URL` no cliente (ex. `ws://localhost:8787/ws`).

**Produção (Vercel + Fly):** ver [`10-deploy-online.md`](./10-deploy-online.md).

Se aparecer `EADDRINUSE` na porta 8787, já há um servidor a correr (sessão anterior). No Windows: `netstat -ano | findstr :8787` e `taskkill /PID <pid> /F`, ou use outra porta: `PORT=8788 pnpm run dev` (e ajuste `VITE_WS_URL`).

## Troubleshooting

| Sintoma | Verificar |
|---------|-----------|
| Disco a saltar | RTT alto; ping no HUD; servidor estável |
| Desync de placar | Apenas servidor incrementa score |
| Lobby não conecta | `VITE_WS_URL`, `ALLOWED_ORIGINS` no servidor; em dev o servidor aceita origens LAN (`192.168.*`, etc.); use `npm run dev` com `host: true` e o colega abre `http://<teu-ip>:5173` |
| Clicar “Entrar” sem efeito | Antes: botão desativado enquanto `connecting` ou `join` perdido se o WS ainda não estava aberto — corrigido com fila de mensagens e timeout de ligação |
