FROM node:24-alpine AS builder

RUN apk add --no-cache libc6-compat gcompat

WORKDIR /app

COPY package.json bun.lockb* ./

RUN npm install -g bun
RUN bun pm cache clear && bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM node:24-alpine

WORKDIR /app

COPY --from=builder /app/.output ./.output

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", ".output/server/index.mjs"]
