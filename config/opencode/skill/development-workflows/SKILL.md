---
name: development-workflows
description: Build and extend software following up-to-date standards. Use when development from zero or from an existing repo, planning architecture or choosing a stack, backend/frontend/UI/deployment, MCP development, agentic or multi-agent development, multi-subagent delegation, long-term planning, or writing testable, future-proof code.
created: 2026-08-30
status: draft
sources:
  - "https://github.com/vercel-labs/agent-skills"  # 293 skills incl. vercel-react-best-practices (70 rules)
  - "https://owasp.org/Top10/2025/"  # OWASP Top 10:2025
  - "https://github.com/modelcontextprotocol/typescript-sdk"  # MCP v2 spec (2026-07-28)
  - "https://12factor.net/"  # 12-factor, still valid 2026
  - "https://blog.stackademic.com/the-12-factor-app-in-2026-whats-still-relevant-and-what-s-just-nostalgia-88b40ec0969c"
  - "https://playwright.dev/"  # e2e
  - "https://opentelemetry.io/"  # observability
tags:
  - skill
  - development
  - meta
---

# Development Workflows (Up-to-Date Full-Stack, 2026)

Scaffold, extend, and ship real projects with a current, maintainable stack and evidence-based engineering practice. **This skill is framework-agnostic at the top, opinionated at the bottom** — pick a tier, follow the recipe, ship.

> **Verify before adding**: Always check the current version of a library/framework via `context7` MCP (`query-docs`, `resolve-library-id`) before writing code that depends on it. Library APIs change fast.

## How to use this skill

1. **Planning a new project** → read [§ Reference stacks](#reference-stacks-tiered) and [§ From-zero workflow](#from-zero-workflow).
2. **Adding a feature** → read [§ Feature workflow](#feature-workflow) and [§ Standards checklist](#standards-checklist).
3. **Reviewing code** → read [§ Code review checklist](#code-review-checklist).
4. **MCP / agent development** → read [§ MCP development](#mcp-development-typescript).
5. **Multi-agent dispatch** → read [§ Multi-agent development](#multi-agent-development).
6. **Deploying** → read [§ Deployment patterns](#deployment-patterns).
7. **Security audit** → read [§ Security: OWASP Top 10:2025](#security-owasp-top-102025).
8. **Production incident** → read [§ Observability](#observability) and [§ Debugging](#debugging).

## Reference stacks (tiered)

Pick the tier that matches the project. Default to **Tier 1 (Pragmatic Monolith)** unless the project has specific needs.

### Tier 1 — Pragmatic Monolith (default, recommended)

- **Frontend:** Vite + React + TypeScript (`create-vite react-ts`)
- **Backend:** Hono on Node via `@hono/node-server`; `app.createApp(db)` factory
- **Data:** better-sqlite3 (sync, transactions as closures); forward-only SQL in `db/migrator`
- **Tests:** Vitest; integration via `app.request()` in-process (no port); unit for pure logic/schemas
- **Dev proxy:** Vite `server.proxy { '/api': { target, changeOrigin: true } }` — no CORS in dev
- **Why this stack:** smallest moving parts, synchronous DB, fastest agent feedback loop, can be deployed anywhere

### Tier 2 — Cloud-Native (when you need scale/edge)

- **Frontend:** Vite/Next.js/Astro + React/Solid/Svelte (pick framework by use case, see [§ Frontend framework choice](#frontend-framework-choice))
- **Backend:** Hono on Cloudflare Workers / Bun / Deno Deploy; D1 or Turso (SQLite at edge) or Neon (serverless Postgres)
- **Data:** Drizzle ORM (type-safe, edge-compatible) over Prisma
- **Tests:** Vitest + `@cloudflare/vitest-pool-workers` for worker unit tests; Playwright for e2e
- **Why this stack:** global low latency, per-request pricing, scales to zero

### Tier 3 — Monorepo (when you have multiple apps/packages)

- **Tooling:** pnpm workspaces + Turborepo (or Nx if you need graph-based task runners)
- **Structure:** `apps/{web,api,worker}/` + `packages/{ui,db,config,types}/`
- **Type sharing:** TypeScript project references; Zod schemas as single source of truth
- **CI:** Turborepo remote cache (Vercel/Cloudflare) for build acceleration
- **Why this stack:** shared types/schemas across apps, atomic changes across boundaries

### Tier 4 — Specialized stacks

- **Realtime/collaborative:** Hono + Yjs (CRDT) + WebSocket/PartyKit
- **Heavy data/ML:** Python (FastAPI) + DuckDB/Polars; agent writes TS glue, Python runs compute
- **CLI tools:** Bun + Clack/Ink; ship as single binary via `bun build --compile`
- **Embedded/local-first:** Tauri (Rust backend, web frontend) or Electron
- **MCP servers:** see [§ MCP development](#mcp-development-typescript)

## From-zero workflow

1. **Plan** — architecture/stack/data model, split into incremental steps
2. **Scaffold** — `npm create vite@latest . -- --template react-ts`; add deps in one batch:
   - Tier 1: `hono @hono/node-server better-sqlite3 zod`
   - dev: `vitest tsx @types/better-sqlite3`
   - optional: `drizzle-orm drizzle-kit` (over hand-written SQL once you have >5 tables)
3. **Backend** — `server/db.ts` (db + migrator), `server/app.ts` (routes + zod boundary), `server/index.ts` (listen)
   - **Rule**: route handlers stay thin; business logic in pure functions; schema in Zod; SQL in `db/` module
4. **Tests** — `tests/api.test.ts` via `app.request()`; unit tests for pure logic + schemas; **run `npm test` early, not last**
5. **Frontend** — UI in `src/`, typed against the API; co-locate components + their CSS
6. **Verify** — test + build + dev-run + manual click-through, then document
7. **Ship** — see [§ Deployment patterns](#deployment-patterns)

## Feature workflow

For every new feature:

1. **Write the failing test first** (TDD where it pays off; pragmatic after-the-fact for UI)
2. **Define the contract** — endpoint URL, request/response Zod schema, error shapes
3. **Implement backend route** — thin handler, delegate to a service function
4. **Implement DB changes** — forward-only migration file (`db/migrator/00XX-name.sql`)
5. **Wire frontend** — type-safe client (use `zod` to parse API responses at boundary)
6. **Test both sides** — unit + integration + manual e2e
7. **Update CHANGELOG / ADR** — record the decision, not just the diff

## Standards checklist

Every project should pass all of these before shipping:

### Code quality
- [ ] **TypeScript strict mode** (`"strict": true`); no `any` in new code (use `unknown` + Zod parse)
- [ ] **Runtime validation at boundaries** (Zod) — never trust external input (HTTP, env, file, DB)
- [ ] **No dead code** — `tsc --noEmit` clean, ESLint/Biome clean
- [ ] **Small modules** — each file fits in an agent's context window
- [ ] **SRP** — one reason to change per module
- [ ] **No shared module-level mutable state** (especially in RSC/SSR; see Vercel `server-no-shared-module-state`)

### Architecture
- [ ] **12-factor**: config via env, stateless processes, dev/prod parity, logs as event streams
- [ ] **Explicit dependencies** — `package.json` lists everything; no implicit global tools
- [ ] **Versioning**: semver + Conventional Commits
- [ ] **ADRs** for significant choices — `docs/adr/0001-*.md` (Context → Decision → Consequences)
- [ ] **Routes thin, services fat** — handlers validate + delegate; services own logic

### Testing
- [ ] **Test pyramid (2026)**: fewer tests, higher up. Pure functions exhaustively unit-tested; integration in-process; E2E only 3–10 critical journeys
- [ ] **Vitest** for unit + integration; `app.request()` for API tests (no port, no supertest)
- [ ] **Playwright** for critical-user-journey E2E only; never grow a flaky E2E layer
- [ ] **No flaky tests** — auto-retrying assertions (`toBeVisible`, `toHaveText`), never raw waits
- [ ] **Run tests before commit** — pre-commit hook or agent discipline

### Performance (from Vercel 70-rule priority tiers)
- [ ] **No waterfalls** — `Promise.all()` for independent ops, Suspense for streaming
- [ ] **Bundle size** — no barrel imports, dynamic imports for heavy components, defer third-party (analytics) until after hydration
- [ ] **Server perf** — `React.cache()` for per-request dedup, LRU for cross-request, `after()` for non-blocking
- [ ] **Re-render hygiene** — stable refs, no inline objects, memoize heavy children
- [ ] **JS micro-perf** — avoid spread-in-loop, prefer `Map`/`Set` over objects for keys

## Frontend framework choice

| Use case | Framework | Why |
|---|---|---|
| General SaaS, marketing + app | **Next.js** (App Router) | RSC, SSR, image opt, vast ecosystem |
| Marketing site, content-heavy | **Astro** | Islands of interactivity, best Lighthouse scores |
| Maximum perf + DX | **SolidStart** | Fine-grained reactivity, React-like syntax, no VDOM |
| Loved-by-developers DX | **SvelteKit** | Less code, excellent primitives |
| Embedded in another app | **Vite + React** | No SSR, smallest dep tree |
| Realtime collab | **Solid/Svelte** + PartyKit | Fine-grained reactivity suits live state |

**Default for Tier 1 (Pragmatic Monolith)**: Vite + React (because the agent's mental model is React, and SSR is not required for the monolith path).

## Database choice

| Use case | DB | ORM/migration |
|---|---|---|
| Single-user, small data, <10GB | **SQLite** (better-sqlite3) | Hand-written SQL in `db/migrator` |
| Multi-user, low traffic, hosted | **SQLite** at edge (Turso) | Drizzle |
| Production SaaS | **Postgres** (Neon, Supabase, RDS) | Drizzle or Prisma |
| Analytics / OLAP | **DuckDB** | SQL |
| Vector search | **pgvector** (in Postgres) or **Qdrant** | Drizzle + dedicated client |
| Document / schemaless | **MongoDB** or **SQLite + JSON1** | Mongoose / hand-rolled |

**Default for Tier 1**: better-sqlite3 (sync, fastest, no daemon).

## Security: OWASP Top 10:2025

Apply these checks to every endpoint, every PR.

| # | Risk | Minimum mitigation |
|---|---|---|
| **A01** | Broken Access Control | Auth check on every route; deny by default; resource-level authorization (not just role) |
| **A02** | Cryptographic Failures | TLS everywhere; bcrypt/argon2 for passwords; never roll your own crypto; secrets in env, not code |
| **A03** | Injection | Zod validate every input; parameterized SQL (never string concat); escape HTML in templates |
| **A04** | Insecure Design | Threat model for new features; rate limiting on auth + expensive ops; fail securely |
| **A05** | Security Misconfiguration | No default creds; disable directory listing; security headers (CSP, HSTS, X-Frame-Options); minimal deps |
| **A06** | Vulnerable & Outdated Components | `npm audit` in CI; `pnpm audit`; dependabot/renovate; pin versions for security-critical deps |
| **A07** | Auth Failures | MFA where possible; rate-limit login; secure session cookies (httpOnly, secure, sameSite); no JWT in localStorage |
| **A08** | Software & Data Integrity Failures | Verify CI/CD pipeline integrity; signed commits/releases; checksum deps; review deserialization |
| **A09** | Logging & Monitoring Failures | Log auth events, access-control failures, input validation failures; alert on anomalies |
| **A10** | SSRF | Validate URLs against an allowlist; block internal IP ranges; disable redirects from user input |

**Secrets management**: never commit `.env`; use `direnv` or `dotenv-vault`; rotate leaked secrets immediately.

## Observability

Three pillars; pick the minimum viable observability for your scale.

| Pillar | Tool (default) | When to add |
|---|---|---|
| **Logs** | `pino` (Node) / structured stdout | Always (first) |
| **Metrics** | OpenTelemetry → Prometheus / VictoriaMetrics | When you have >1 instance or >100 RPS |
| **Traces** | OpenTelemetry → Jaeger / Honeycomb | When debugging latency across services |
| **Errors** | Sentry / GlitchTip | When you have users you don't directly debug for |

**Rule**: every request gets a `request_id` (UUID v7) that flows through logs, metrics, and error reports. Never log secrets or PII.

## Deployment patterns

| Target | When | Key command / file |
|---|---|---|
| **Vercel** | Next.js / Vite + serverless functions | `vercel.json` + `vercel deploy` |
| **Cloudflare Workers** | Edge, low latency, D1/KV | `wrangler.toml` + `wrangler deploy` |
| **Fly.io** | Full Node, multi-region, persistent disk | `fly.toml` + `fly deploy` |
| **Railway / Render** | Quickest full-stack deploy | `railway.toml` / `render.yaml` |
| **Docker** | Self-hosted, predictable env | `Dockerfile` (multi-stage) + `docker-compose.yml` |
| **Bare Node** | Single VPS, simple ops | `systemd` unit + Caddy/Nginx |
| **Bun** | When you want 3× faster startup | `bun run --hot src/index.ts` |

**Default for Tier 1 dev**: `node --watch src/index.ts` (Node 22+) or `tsx watch` for TS.
**Default for Tier 1 prod**: Docker on Fly.io or Railway (cheapest predictable).

**Never**:
- ❌ Deploy with `npm run dev` style
- ❌ Commit `node_modules` or `.env`
- ❌ Run as root in production
- ❌ Expose debug endpoints (`/debug`, `/_debugbar`) in prod

## MCP development (TypeScript)

> **Status note (verified 2026-08-30):** MCP v2 spec was released **2026-07-28**. The v1 SDK (`@modelcontextprotocol/sdk`) still works but new projects should target v2 (`@modelcontextprotocol/server` + `/client`, `serveStdio()` helper). When in doubt, check `context7` for the current API.

### v2 (2026 spec) — current

- **Packages:** `@modelcontextprotocol/server` + `/client`; one helper: `serveStdio()`
- **Tools:** define with name/description/input-schema (Zod) + handler
- **Resources:** `registerResource` for read-only URI-addressed data
- **Prompts:** `registerPrompt` for templated user-invocable prompts
- **Transport:** `StdioServerTransport` for local; `StreamableHTTPTransport` for remote
- **Logging:** `server.sendLoggingMessage()` — **never `console.log` on stdio** (stdout is the protocol; use `console.error` or the logging API)
- **Errors:** set `isError: true` in the result, not throw — the client decides how to surface

### Universal rules (both v1 and v2)

- **Schema discipline:** every tool input is Zod-validated; never trust the client
- **Idempotency:** design for retry (idempotency keys for mutating tools)
- **Timeouts:** every external call has a timeout (default 30s); never block indefinitely
- **Local installs:** if your server wraps a native dep, it may need a local `npm install` (no prebuilt binaries via `npx`)

### When to write a new MCP server

- The same tool is needed by ≥2 agents or workflows
- The tool needs auth/secret handling that shouldn't live in agent prompts
- The tool is non-trivial (multi-step, stateful) and benefits from a single canonical implementation

Don't write a server if a `Bash` + `npx` one-liner, a built-in `webfetch`, or a simple Zod-validated CLI works.

## Multi-agent development

> **Load `domain-orchestrator` first** if the task is non-trivial.

### Patterns

- **Parallelize research, not implementation.** Fan out read-only reviewers (security, test gaps, API mapping). Author fixes issues in the fix loop.
- **Define interfaces first** (a versioned contract/spec), then implement against it. Specs are the agent's contract.
- **Cap fix loops at ~3 iterations**, then escalate/question the spec, not the code.
- **Isolate parallel agents with git worktrees**; commit a baseline before dispatch; never `git add -A` in shared work.
- **Read-only fan-out:** planner, critic, fact-checker, security-reviewer, test-gap-finder. Author one agent owns writes.

### When to fan out

- Multi-file refactor across ≥3 modules → planner + 2 reviewers
- New feature with unclear spec → spec-writer + 2 critics
- Security-sensitive change → security-reviewer (mandatory) + author
- Performance regression → profiler + reproducer + fixer

### When NOT to fan out

- Single-file changes, <50 LOC
- Trivial fixes (typos, naming)
- Any change requiring a human design decision (ask first)

## Code review checklist

When reviewing PRs (yours or an agent's):

- [ ] Tests added/updated; coverage is meaningful (not just lines)
- [ ] Zod schema at every external boundary (HTTP, env, file, DB)
- [ ] No `any`, no `as` casts, no `@ts-ignore` without justification
- [ ] Errors are typed, logged, and surfaced (not swallowed)
- [ ] No secrets, no PII in code or logs
- [ ] No new dependencies without justification (bundle size, supply chain, license)
- [ ] No barrel imports that re-export everything
- [ ] No `setTimeout`/`sleep` to wait on async — use proper awaiting
- [ ] No module-level mutable state in server components / SSR
- [ ] Migration is forward-only; no destructive schema changes
- [ ] CHANGELOG and/or ADR updated
- [ ] Security checklist (OWASP A01–A10) applied

## Debugging

When something is broken:

1. **Read the complete error** — don't skim
2. **Reproduce minimally** — smallest input that fails
3. **Bisect** — git bisect or feature-flag toggles
4. **Add instrumentation** — logs, metrics, traces
5. **Hypothesize + test** — change one thing at a time
6. **Document the fix** — the cause and the resolution, not just the diff

Use `sentinel_monitor` (long-running log tail) and `terminal_exec` (background dev server) for live debugging. Use `lemma memory_add` to record the root cause once found — don't make the user re-derive it.

## When to write vs. use existing

| Decision | Default |
|---|---|
| New dep | Check stdlib + context7 first; add only if it solves a real problem |
| New microservice | Don't, until monolith hurts |
| New framework | Don't, until current one blocks you |
| New database | Don't, until the current one hits its limit |
| New pattern (DI, repository, etc.) | Don't, until pain is real |
| New abstraction | Write 3 examples first, then abstract |

## Common mistakes to avoid

- ❌ Guess library versions — check `package.json` and `context7` first
- ❌ Add dependencies for trivial functionality (`lodash` for `_.uniq`, `date-fns` for `new Date()`)
- ❌ Premature microservice split
- ❌ Custom auth/crypto — use battle-tested libraries
- ❌ String-concat SQL — always parameterized
- ❌ `console.log` in production code (use structured logger)
- ❌ Mock-heavy unit tests that don't exercise real behavior
- ❌ E2E tests that grow flaky (delete them, write integration tests instead)
- ❌ Long-running sync operations in request handlers (use `after()` or a queue)
- ❌ Module-level mutable state in SSR
- ❌ `git add -A` after a multi-agent run
- ❌ Skip code review on "small" PRs
- ❌ Deploy without running tests in CI

## Tools in our stack

- **Vite** for dev server and build (frontend)
- **Hono** for HTTP routing (lightweight, edge-portable)
- **better-sqlite3** for storage (default), Drizzle when needed
- **Vitest** for unit + integration tests
- **Playwright** for E2E (load `browser-control` skill)
- **Biome** for formatting + linting (faster than ESLint+Prettier)
- **Zod** for runtime validation
- **OpenCode** for agent harness; **MCP** for tool surface
- **Docker** for reproducible prod; **Fly.io** / **Cloudflare** for hosting
- **OpenTelemetry** + **Sentry** for observability when scale demands

## Related skills

- `domain-orchestrator` (routing), `deep-research` (verify versions/standards), `browser-control` (E2E), `notetaking-brain` (ADRs + changelog), `business-planning` (if building a product)
