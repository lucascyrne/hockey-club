# Servidor WebSocket (lobby + relay) — NÃO usar gostatic aqui.
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY shared ./shared
COPY server ./server

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787

CMD ["npx", "tsx", "server/src/index.ts"]
