FROM node:22-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/web/ apps/web/
COPY packages/shared/ packages/shared/

RUN pnpm install --frozen-lockfile --filter @agora/web...
RUN VITE_API_URL=$VITE_API_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    pnpm --filter @agora/web build
RUN npm install -g serve

EXPOSE 80
CMD ["serve", "-s", "apps/web/dist", "-l", "80"]
