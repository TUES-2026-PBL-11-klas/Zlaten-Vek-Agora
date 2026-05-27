# syntax=docker/dockerfile:1.9
# Multi-stage build for @agora/web. Build context is the repo root:
#   docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=/api -t agora-web .

ARG NODE_VERSION=20
ARG NGINX_VERSION=1.27

# Stage 1 - install workspace deps
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    PNPM_STORE_DIR=/pnpm-store \
    pnpm install --frozen-lockfile --filter @agora/web...

# Stage 2 - build the Vite bundle (VITE_* baked in)
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
COPY --from=deps /workspace ./
ARG VITE_API_URL=/api
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared
RUN pnpm --filter @agora/web build

# Stage 3 - nginx static server
FROM nginx:${NGINX_VERSION}-alpine AS runner
RUN rm /etc/nginx/conf.d/default.conf
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html
EXPOSE 80
STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]
