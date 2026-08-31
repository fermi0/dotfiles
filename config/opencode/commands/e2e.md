---
name: e2e
description: Run Playwright e2e tests for the zurnel-saas CBMS SaaS slice (Vite + Hono + drizzle)
---

# /e2e — Playwright E2E for zurnel-saas

Runs e2e tests against the CBMS Invoice Validator SaaS (Vite 8 + React 19 + Hono 4 + drizzle + better-sqlite3).

## Usage

```
/e2e [options]
```

## What it does

1. Starts API server (`npm run server` → :3001)
2. Starts Vite dev server (`npm run dev` → :5173, proxy /api→:3001)
3. Runs `npx playwright test e2e` (3 tests: create, delete, validation)
4. Tears down

## Prerequisites

- `~/projects/zurnel-saas` exists (Vite+Hono+drizzle, 5 vitest + 3 e2e pass, build green)
- `npx playwright install chromium` done (chromium-1234 cached)

## Verification

```bash
cd ~/projects/zurnel-saas && npm test # 5 passed
npm run build # vite 84ms, 61KB gzip
npx playwright test e2e --reporter=list # 3 passed 4.6s
```

## Implementation

```bash
#!/usr/bin/env bash
set -euo pipefail
PROJECT_ROOT="/home/work/projects/zurnel-saas"
cd "$PROJECT_ROOT"
exec npx playwright test e2e "$@"
```
