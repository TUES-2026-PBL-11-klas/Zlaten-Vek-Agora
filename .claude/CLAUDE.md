# Agora

Web app that simulates structured multi-agent AI debates over bills/policies. User uploads a PDF or pastes text → `AnalysisAgent` extracts affected groups → one `PersonaAgent` per group debates in rounds → `JudgeAgent` synthesizes contradictions, common ground, and compromises.

This is a graded school project. Requirements from the РС / ООП / БД / ВОТ rubrics are load-bearing — see "Assignment guardrails" below before refactoring.

## Stack

- **Monorepo:** pnpm workspaces + Turborepo. Node ≥ 20, pnpm ≥ 10.
- **Web:** Vite + React + TS + Tailwind. TanStack Query for data, `EventSource` (SSE) for streaming debate messages.
- **API:** NestJS + TS. REST (JSON) for CRUD, SSE (`text/event-stream`) for live agent replies.
- **DB:** PostgreSQL on Supabase, accessed via Prisma. Supabase Auth (email + JWT).
- **LLM:** OpenAI API, `gpt-4o-mini`, streaming.
- **Shared:** `@agora/shared` — DTOs and HTTP contracts imported by both apps. Put anything used on both sides here, not in `apps/*`.

## Layout

```
apps/api/src/modules/<feature>/{domain,application,infrastructure,presentation}
apps/web/src/{app,pages,features,entities,shared}
packages/shared/         # DTOs shared by web + api
docs/diagrams/           # architecture, db, infrastructure, uml (source of truth)
```

## Layer rules — do not violate

- **API (inward-only):** `presentation → application → domain`. `infrastructure` implements `domain` ports and is wired in the module file. `domain` imports nothing — no NestJS, no Prisma, no HTTP types.
- **Web (downward-only):** `app → pages → features → entities → shared`. A lower layer never imports from a higher one.
- New external dependency (Prisma client, OpenAI client, Supabase client) → goes in `infrastructure` behind a domain port. Never call it from a service directly.

## Commands

```bash
pnpm dev                          # both apps via turbo (web :5173, api :3001)
pnpm --filter @agora/web dev      # one app only
pnpm --filter @agora/api dev
pnpm build | typecheck | test | lint
```

Husky runs on commit (lint-staged + typecheck) and push (gitleaks + tests). Don't bypass with `--no-verify`. If gitleaks isn't installed: `brew install gitleaks`.

## Assignment guardrails (don't refactor these away)

These exist to satisfy the rubric. They look like over-engineering but are required.

- **Patterns that must remain visible in code:**
  - `Strategy` — every agent implements `IDebateAgent.generateResponse(context)`.
  - `Chain of Responsibility` — `AgentOrchestrator` walks agents in round order.
  - `Repository` — all DB access goes through `I*Repository` ports.
  - `Factory` — `PersonaAgentFactory` builds agents from `AnalysisResult`.
- **Inheritance hierarchy:** `BaseAgent` → `PersonaAgent | JudgeAgent | AnalysisAgent`. Keep it; the UML diagram and ООП rubric depend on it.
- **SOLID applied:** `AgentOrchestrator` only orchestrates (SRP), depends on `IDebateAgent` not concrete agents (DIP), new agent types extend via new subclass (OCP).
- **Custom exceptions** extend a shared `AppException`: `DebateNotFoundException`, `PersonaGenerationException`, `BillParsingException`. Don't replace with generic `throw new Error`.
- **Concurrency:** active debate sessions live in a `ConcurrentHashMap`-style structure (Map keyed by debate id); agent generation uses async/`CompletableFuture`-equivalent. Don't make it serial just because it's simpler.
- **Test coverage ≥ 50%.** When adding logic to `AgentOrchestrator`, `DebateService`, `PersonaService`, add tests in the same PR.
- **PRs need ≥ 1 review** (branch protection on `main`). Each teammate does ≥ 2 reviews/week — this is logged.

## Database

- Tables (snake_case): `users, debates, personas, debate_messages, rounds, analysis_results, judge_conclusions`. See [docs/diagrams/database-diagram.png](docs/diagrams/database-diagram.png).
- 3NF. `personas` is its own table — never inline demographic fields into `debate_messages`.
- Prisma: **eager-load `persona` when loading `debate_messages`** (chat UI always needs it). Lazy-load full history.
- Schema changes ship as a new Prisma migration file. Don't edit applied migrations.

## Streaming

- Agent replies stream token-by-token over SSE. Web subscribes with `EventSource` per debate. Backpressure handled per-connection — don't broadcast a single stream to multiple clients.
- The frontend has two modes: auto-play (run to completion) and step-by-step (user advances rounds). Keep both working.

## Diagrams = source of truth

If you change architecture, DB schema, class hierarchy, or infra, update the matching PNG in [docs/diagrams/](docs/diagrams/) in the same PR. The diagrams are graded artifacts.

## Things to ask, not assume

- Adding a new agent type → confirm whether it belongs in the UML diagram and which `BaseAgent` subclass.
- Swapping Prisma / Supabase / OpenAI → don't. They're fixed by the rubric.
- Adding a queue, Redis, microservice split → don't unless asked. The infra diagram is k3s + Postgres + OpenAI; keep it.

## Instructions
- Never add Claude / Anthropic co-author trailers, "Generated with Claude Code" footers, or any AI attribution to commit messages or PR descriptions. Write them as if a human authored the change.
- Never use em dashes (—) in copy. Use hyphens (-) instead.
- Before doing any frontend work (new components, pages, styling, or visual changes), read [.claude/design.md](.claude/design.md) and follow it. It defines the color tokens, typography scale, persona palette, component rules, and voice. Don't introduce new tokens, fonts, shadows, or persona-hue reassignments without updating that file first.