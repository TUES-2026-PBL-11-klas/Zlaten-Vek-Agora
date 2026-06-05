FROM node:22-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
RUN apk add --no-cache openssl

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/

RUN pnpm install --frozen-lockfile --filter @agora/api...
RUN pnpm --filter @agora/shared build && \
    pnpm --filter @agora/api db:generate && \
    pnpm --filter @agora/api build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
