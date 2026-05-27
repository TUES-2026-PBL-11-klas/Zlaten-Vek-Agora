# syntax=docker/dockerfile:1.9
#
# Multi-stage build for @agora/api (NestJS + Prisma).
#   1. deps   - pnpm install (dev + prod) for the api workspace
#   2. build  - prisma generate + nest build, then pnpm deploy --prod into /deploy
#   3. runner - slim Node 20 runtime with only the deployed tree
#
# Build context is the repo root. From the root:
#   docker build -f apps/api/Dockerfile -t agora-api .

ARG NODE_VERSION=20

###############################################################################
# Stage 1 - install all workspace deps needed to build the api
###############################################################################
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    PNPM_STORE_DIR=/pnpm-store \
    pnpm install --frozen-lockfile --filter @agora/api...

###############################################################################
# Stage 2 - build the api and assemble a prod-only deploy tree at /deploy
###############################################################################
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /workspace

RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

COPY --from=deps /workspace ./

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

RUN pnpm --filter @agora/api db:generate \
 && pnpm --filter @agora/api build

# `pnpm deploy` assembles an isolated prod-only tree (workspace deps resolved,
# devDependencies pruned) at /deploy.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    PNPM_STORE_DIR=/pnpm-store \
    pnpm --filter @agora/api deploy --prod /deploy

# `pnpm deploy` re-installs from the store, so the generated Prisma Client
# (.prisma/client, written into pnpm's internal copy of @prisma/client) is not
# in the deploy tree. Copy it across so @prisma/client can resolve it at runtime.
RUN cp -R /workspace/node_modules/.pnpm/@prisma+client@*/node_modules/.prisma \
          /deploy/node_modules/.prisma

###############################################################################
# Stage 3 - minimal runtime
###############################################################################
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl tini ca-certificates

RUN addgroup -S -g 1001 nodejs \
 && adduser  -S -u 1001 -G nodejs -h /app -s /sbin/nologin nestjs

ENV NODE_ENV=production \
    PORT=3000

COPY --from=build --chown=nestjs:nodejs /deploy/dist          ./dist
COPY --from=build --chown=nestjs:nodejs /deploy/prisma        ./prisma
COPY --from=build --chown=nestjs:nodejs /deploy/node_modules  ./node_modules
COPY --from=build --chown=nestjs:nodejs /deploy/package.json  ./package.json

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
