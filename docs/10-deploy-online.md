# Deploy online (Vercel + Fly.io)

## Arquitetura

| Peça | URL | Função |
|------|-----|--------|
| Frontend | [hockey-club-bay.vercel.app](https://hockey-club-bay.vercel.app/) | Build Vite estático |
| WebSocket | `wss://hockey-table-ws.fly.dev/ws` | Servidor autoritativo (`server/`) |

O `.env` local **não** é enviado para a Vercel nem para o Fly. Cada plataforma tem as suas variáveis.

## Vercel (frontend)

1. **Project → Settings → Environment Variables**
2. Adicionar para **Production** (e Preview, se quiseres testar PRs):

   `VITE_WS_URL` = `wss://hockey-table-ws.fly.dev/ws`

3. **Redeploy obrigatório** após alterar — o Vite embute `VITE_*` no build. Sem redeploy, o bundle continua sem URL de WS.

4. Confirmar no browser: DevTools → Sources → procurar `fly.dev` no JS. Se não existir, a variável não entrou no build.

## Fly.io (servidor WS)

1. Secrets (não uses só o `.env` do repo):

```bash
fly secrets set ALLOWED_ORIGINS="https://hockey-club-bay.vercel.app,http://localhost:5173" -a hockey-table-ws
```

Inclui `https://www.horizonte.dev.br` se o jogo for embutido noutro domínio.

2. **Uma máquina só** — evita WS cair numa VM parada:

```bash
fly scale count 1 -a hockey-table-ws
fly machine list -a hockey-table-ws   # deve haver 1 machine "started"
```

3. **Conta trial** — máquinas trial podem parar ao fim de ~5 min e o proxy devolve `machine is in a non-startable state`. Para produção estável: cartão na conta Fly ou plano pago.

4. Deploy do servidor:

```bash
fly deploy --config server/fly.toml
```

5. Testar:

```bash
curl https://hockey-table-ws.fly.dev/health
# {"ok":true}
```

## Checklist rápido

| Sintoma | Causa provável |
|---------|----------------|
| "Servidor online não configurado" | `VITE_WS_URL` ausente no build Vercel → redeploy |
| "Não foi possível ligar" | Fly parado, trial expirado, ou 2 máquinas (uma stopped) |
| WS abre mas fecha `1008 origin_not_allowed` | Secret `ALLOWED_ORIGINS` no Fly; após alterar, `fly deploy` (o servidor lê `process.env.ALLOWED_ORIGINS` no arranque) |
| WS abre mas não cria sala | Servidor antigo ou proxy Fly → `fly deploy` + `fly scale count 1` |
| Preview Vercel não liga | Origem `*.vercel.app` — suportado se `hockey-club-bay.vercel.app` está em `ALLOWED_ORIGINS` |
| Local OK, produção não | Normal: local usa proxy Vite; produção precisa Fly + env Vercel |

## Origens permitidas

O servidor valida o header `Origin` no handshake. Em produção (`NODE_ENV=production`) só aceita:

- Lista em `ALLOWED_ORIGINS` (secret no Fly)
- Qualquer `*.vercel.app` se a lista incluir um host `vercel.app`

Localmente (dev), IPs LAN (`192.168.*`, etc.) são aceites automaticamente.
