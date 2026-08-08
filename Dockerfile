# ⚠️ DEPRECATED: This Dockerfile is NOT used in production.
# Production deployment uses Vercel. This file is kept for local development reference only.
# See vercel.json for the actual deployment configuration.
FROM node:24-slim AS builder

RUN npm install -g bun

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM node:24-slim

WORKDIR /app

COPY --from=builder /app/.output ./.output

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", ".output/server/index.mjs"]
