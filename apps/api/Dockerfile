# syntax=docker/dockerfile:1.9
# Multi-stage build for @agora/api. Build context is the repo root:
#   docker build -f apps/api/Dockerfile -t agora-api .

ARG NODE_VERSION=20

# Stage 1 - install workspace deps
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    PNPM_STORE_DIR=/pnpm-store \
    pnpm install --frozen-lockfile --filter @agora/api...

# Stage 2 - build + assemble prod deploy tree
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /workspace
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
COPY --from=deps /workspace ./
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
RUN pnpm --filter @agora/shared build \
 && pnpm --filter @agora/api db:generate \
 && pnpm --filter @agora/api build
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    PNPM_STORE_DIR=/pnpm-store \
    pnpm --filter @agora/api deploy --legacy --prod /deploy
# Regenerate Prisma client into /deploy (pnpm deploy re-installs from the
# store and drops the previously generated client).
RUN cd /deploy && ./node_modules/.bin/prisma generate

# Stage 3 - runtime
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl ca-certificates
RUN addgroup -S -g 1001 nodejs \
 && adduser  -S -u 1001 -G nodejs -h /app -s /sbin/nologin nestjs
ENV NODE_ENV=production \
    PORT=3000
COPY --from=build --chown=nestjs:nodejs /deploy/dist         ./dist
COPY --from=build --chown=nestjs:nodejs /deploy/prisma       ./prisma
COPY --from=build --chown=nestjs:nodejs /deploy/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /deploy/package.json ./package.json
USER nestjs
EXPOSE 3000
CMD ["node", "dist/main.js"]
