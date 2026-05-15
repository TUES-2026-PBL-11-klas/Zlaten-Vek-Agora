FROM node:22-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/

RUN pnpm install --frozen-lockfile --filter @agora/api...
RUN pnpm --filter @agora/api prisma:generate && \
    pnpm --filter @agora/api build

EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
