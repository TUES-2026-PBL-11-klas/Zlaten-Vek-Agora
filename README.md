# Zlaten Vek — Agora

Monorepo: Vite + React web app and NestJS API, both with a layered architecture and a shared types workspace.

## Layout

```
.
├── apps/
│   ├── api/                          # NestJS — layered (domain / application / infrastructure / presentation)
│   │   └── src/
│   │       ├── modules/users/
│   │       │   ├── domain/           # entities, repository interfaces (pure)
│   │       │   ├── application/      # services, use-cases, DTOs, mappers
│   │       │   ├── infrastructure/   # repository implementations, persistence
│   │       │   └── presentation/     # HTTP controllers
│   │       ├── app.module.ts
│   │       └── main.ts
│   └── web/                          # Vite + React + TS — layered (app / pages / features / entities / shared)
│       └── src/
│           ├── app/                  # bootstrap: providers, router, global styles
│           ├── pages/                # route-level pages
│           ├── features/             # feature modules (UI + hooks)
│           ├── entities/             # domain models + per-entity API
│           └── shared/               # cross-cutting utilities (http client, ui, lib)
├── packages/
│   └── shared/                       # @agora/shared — DTOs and HTTP contracts used by both apps
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

### Layer dependency rules

**API (inward only):** `presentation` → `application` → `domain`; `infrastructure` implements `domain` interfaces and is wired in the module file. `domain` depends on nothing.

**Web (downward only):** `app` → `pages` → `features` → `entities` → `shared`. A lower layer must never import from a higher one.

## Prerequisites

- Docker + Docker Compose
- Node.js ≥ 20 and pnpm ≥ 10 (only if you want to run the apps natively on the host)

The database is Supabase (Postgres). Local dev points at the same `DATABASE_URL` you set in `.env`; there is no Postgres container.

## Quick start (Docker)

```bash
cp .env.example .env          # fill in DATABASE_URL + SUPABASE_* values
docker compose up --build     # first run builds the images
```

- Web: http://localhost:5173
- API: http://localhost:3000/health (other routes under `/api`)

The web container serves the Vite production build as static files. `VITE_API_URL` is baked into the bundle at build time (default `http://localhost:3000/api`), so the browser calls the api directly. Edit a frontend file and you need to `docker compose up --build web` to see it. For an iterative dev loop with hot reload, use the host-app variant below.

Environment variables are documented in [.env.example](.env.example). `.env` is gitignored; real Supabase / OpenAI keys live in GitHub Secrets and k3s Secrets (M5).

## Prebuilt images (GHCR)

The CD workflow ([.github/workflows/cd.yml](.github/workflows/cd.yml)) builds multi-stage images for both apps on every push to `main` and on every `v*` tag, then pushes them to GitHub Container Registry:

- `ghcr.io/<owner>/agora-api:<tag>` — NestJS + Prisma on slim Node 20 (Alpine), runs as non-root, exposes `:3000`.
- `ghcr.io/<owner>/agora-web:<tag>` — Vite bundle served by nginx, exposes `:80`.

Tags published: `latest` (main only), `sha-<short>`, `sha-<long>`, and on tag pushes `<version>` plus `<major>.<minor>`.

### Smoke run locally

Pull and run the latest images with the env vars from [.env.example](.env.example). Replace `<owner>` with the GitHub org/user that owns the fork (e.g. `tues-2026-pbl-11-klas`); GHCR is case-insensitive but the action publishes lowercased names.

```bash
# 1. Authenticate to GHCR (only needed if the package is private):
echo "$GHCR_PAT" | docker login ghcr.io -u <your-github-user> --password-stdin

# 2. Make sure .env is filled in.
cp .env.example .env

# 3. API - reads env vars at runtime.
docker run --rm -d --name agora-api \
  -p 3000:3000 \
  --env-file .env \
  ghcr.io/<owner>/agora-api:latest

# Health check (returns "ok" once the app is up):
curl -fsS http://localhost:3000/health

# 4. Web - the VITE_* values are baked at build time, so the prebuilt image
#    uses whatever was configured in the CD workflow. To point it at the
#    local api, expose the api on the host and rebuild the web image with:
docker build \
  -f apps/web/Dockerfile \
  --build-arg VITE_API_URL=http://localhost:3000/api \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  -t agora-web:local .

docker run --rm -d --name agora-web -p 5173:80 agora-web:local

# Smoke test the SPA shell:
curl -fsS http://localhost:5173/ | head -n 5

# Tear down:
docker rm -f agora-api agora-web
```

Image size budget (gzipped layers reported by GHCR): **api < 300 MB, web < 50 MB**.

## Develop with apps on the host

For day-to-day frontend/backend work you'll want hot reload:

```bash
pnpm install
pnpm dev                                # api on :3001, web on :5173
```

- Web: http://localhost:5173
- API: http://localhost:3001/api (proxied from web as `/api/*`)

Copy [apps/api/.env.example](apps/api/.env.example) to `apps/api/.env` and set `DATABASE_URL` to your Supabase connection string.

Run just one app:

```bash
pnpm --filter @agora/web dev
pnpm --filter @agora/api dev
```

## Build / typecheck / test

```bash
pnpm build
pnpm typecheck
pnpm test
```

## Quality gates

### Local (Husky)

- **pre-commit** — runs `lint-staged` (ESLint `--fix` + Prettier on staged `.ts`/`.tsx`/`.json`/`.md`/`.yml`) then `pnpm typecheck` across all workspaces.
- **pre-push** — runs `gitleaks` (staged + new commits) then `pnpm test`. Install gitleaks once: `brew install gitleaks`.

Hooks install automatically via the `prepare` script after `pnpm install`. If they ever disappear, run `pnpm exec husky` to reinstall.

### CI ([.github/workflows/ci.yml](.github/workflows/ci.yml))

Runs on every PR targeting `main` and every push to non-`main` branches. Jobs: `lint` → `secret-scan` → `type-check` → `test` → `build` (`pnpm build` — turbo compiles both apps). A `notify` job comments on the PR listing which job failed.

### CD ([.github/workflows/cd.yml](.github/workflows/cd.yml))

Runs on push to `main` and on `v*` tag pushes. Matrix builds the `api` and `web` multi-stage images with Buildx (gha cache), then pushes them to `ghcr.io/<owner>/agora-api` and `ghcr.io/<owner>/agora-web`. Tags: `latest` (main only), `sha-<short>`, `sha-<long>`, and on tag pushes `<version>` + `<major>.<minor>`. The k3s rollout step lands in a follow-up.

Required CI configuration:

- **Repository → Settings → Actions → General → Workflow permissions:** `Read and write permissions` (so `GITHUB_TOKEN` can push to GHCR).
- **Repository → Settings → Secrets and variables → Actions:**
  - `VITE_SUPABASE_ANON_KEY` (secret) — baked into the web bundle at build time.
  - `VITE_SUPABASE_URL`, `VITE_API_URL` (variables) — optional; default to `/api` for the API URL.

### Branch protection — configure once on GitHub

`Settings → Branches → Add branch protection rule` for `main`:

- ✅ Require a pull request before merging
  - Require approvals: **1** (each teammate does ≥ 2 reviews/week — ВОТ requirement)
  - Dismiss stale approvals on new commits
- ✅ Require status checks to pass before merging
  - Required checks: `Lint (ESLint + Prettier)`, `Secret scan (gitleaks)`, `Type-check (tsc --noEmit)`, `Unit tests`, `Build (api + web)`
  - Require branches to be up to date before merging
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above (uncheck "Allow administrators to bypass")
- ❌ Allow force pushes / deletions — leave off

## Endpoints

- `GET  /api/users`
- `GET  /api/users/:id`
- `POST /api/users` body: `{ "email": string, "name": string }`

The default repository is in-memory; swap `InMemoryUserRepository` for a real implementation in `apps/api/src/modules/users/users.module.ts`.
