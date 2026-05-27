# Incorporar no portfólio (iframe)

O deploy na Vercel envia `Content-Security-Policy: frame-ancestors` (definido em [`config/embed.json`](../config/embed.json), sincronizado para [`vercel.json`](../vercel.json) no `npm run build`):

- `https://horizonte.dev.br` e `https://www.horizonte.dev.br` (portfólio)
- `http://localhost:3000` (portfólio Next.js em dev)
- `https://hockey-club-bay.vercel.app` (preview Vercel do portfólio, se aplicável)
- abertura direta do jogo (`'self'`)

Em `npm run dev` / `preview`, o Vite inclui também `localhost:5173` para testar o iframe localmente.

## No site horizonte.dev.br

```html
<iframe
  src="https://SEU-DEPLOY.vercel.app"
  title="Hockey Table"
  width="100%"
  height="min(720px, 85vh)"
  loading="lazy"
  allow="fullscreen"
  referrerpolicy="no-referrer-when-downgrade"
  style="border: 0; border-radius: 8px; display: block;"
></iframe>
```

Se o portfólio tiver CSP própria, inclua o URL do jogo em `frame-src` (ou `child-src`):

```
frame-src 'self' https://SEU-DEPLOY.vercel.app;
```

Evite `sandbox` restritivo no iframe (WebGL e pointer events precisam de permissões normais).

## Alterar domínios permitidos

1. Edite [`config/embed.json`](../config/embed.json) (`frameAncestors` = produção; `frameAncestorsDev` = só Vite).
2. Execute `npm run embed:sync-vercel` (ou `npm run build`) para atualizar [`vercel.json`](../vercel.json).

Cada origem deve ser explícita (sem `https://*` em CSP).

## Desenvolvimento local

- Portfólio em `http://localhost:3000` embutindo o jogo na **Vercel**: já permitido em `frameAncestors`.
- Jogo em `npm run dev` (`localhost:5173`): origens extra via `frameAncestorsDev` no Vite.
