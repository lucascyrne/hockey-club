# Incorporar no portfólio (iframe)

O deploy na Vercel envia `Content-Security-Policy: frame-ancestors` permitindo embed apenas em:

- `https://horizonte.dev.br`
- `https://www.horizonte.dev.br`
- abertura direta do jogo (`'self'`)

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

Edite [`config/embed.json`](../config/embed.json) e o valor em [`vercel.json`](../vercel.json) (produção).

## Desenvolvimento local

`npm run dev` / `npm run preview` também permitem embed a partir de `localhost:3000` e `localhost:5173` para testar o iframe no portfólio em dev.
