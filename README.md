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

- Node.js ≥ 20
- pnpm ≥ 10

## Install

```bash
pnpm install
```

## Develop

Run both apps in parallel via Turborepo:

```bash
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3001/api  (proxied from web as `/api/*`)

Run just one:

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

## Endpoints

- `GET  /api/users`
- `GET  /api/users/:id`
- `POST /api/users`  body: `{ "email": string, "name": string }`

The default repository is in-memory; swap `InMemoryUserRepository` for a real implementation in `apps/api/src/modules/users/users.module.ts`.
