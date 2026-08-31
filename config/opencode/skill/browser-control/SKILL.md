---
name: browser-control
description: Drive the browser autonomously via the Playwright MCP for AI agents. Use when navigating, browsing, searching a website, multi-step browser execution, web automation, clicking/typing/reading a page, scraping, web-app QA, or generating and running end-to-end (e2e) browser tests with @playwright/test. Covers accessibility testing (axe-core), visual regression, cross-browser testing, mobile emulation, and CI integration.
created: 2026-08-30
status: draft
sources:
  - "https://playwright.dev/docs/getting-started-mcp"  # Playwright MCP server docs
  - "https://github.com/microsoft/playwright-mcp"  # official MCP repo
  - "https://playwright.dev/"  # main docs
  - "https://www.browserstack.com/guide/playwright-locator"  # 2026 locator best practices
  - "https://qaskills.sh/blog/axe-core-playwright-accessibility-testing-2026"  # @axe-core/playwright 2026
  - "https://www.browserstack.com/guide/playwright-tutorial"  # 2026 tutorial
tags:
  - skill
  - browser
  - playwright
  - testing
  - meta
---

# Browser Control (Playwright MCP + @playwright/test, 2026)

Drive a real browser through the **`playwright` MCP server** for AI-agent automation, and through **`@playwright/test`** for repeatable test suites. **The accessibility snapshot is the source of truth** — not screenshots.

> **The MCP server is for the agent. @playwright/test is for CI.** Use MCP for ad-hoc research, scraping, and exploration. Use @playwright/test for tests that must run reliably on every commit.

## How to use this skill

1. **Quick interaction (research, scraping, single page)** → [§ Core loop](#core-loop) + [§ Tool reference](#tool-reference)
2. **Locating elements** → [§ Locator strategies](#locator-strategies) + [§ Snapshot ref lifecycle](#snapshot-ref-lifecycle)
3. **Multi-step automation** → [§ Multi-step & failure recovery](#multi-step--failure-recovery)
4. **Forms** (multi-field, file upload, dropdowns) → [§ Form patterns](#form-patterns)
5. **Authentication, sessions, 2FA** → [§ Authentication patterns](#authentication-patterns)
6. **Multi-tab, drag/drop, dialogs, JS evaluation** → [§ Advanced interactions](#advanced-interactions)
7. **Network inspection / mocking** → [§ Network & console](#network--console)
8. **E2E test suite (@playwright/test)** → [§ E2E test generation & execution](#e2e-test-generation--execution)
9. **Accessibility testing** → [§ Accessibility testing (axe-core)](#accessibility-testing-axe-core)
10. **Visual regression** → [§ Visual regression](#visual-regression)
11. **Cross-browser / mobile / throttling** → [§ Cross-browser, mobile, performance](#cross-browser-mobile-performance)
12. **CI integration** → [§ CI integration](#ci-integration)
13. **What went wrong** → [§ Failure modes & debugging](#failure-modes--debugging) + [§ Common mistakes](#common-mistakes)

## Core loop

The same five-step loop works for any browser task, whether through the MCP or @playwright/test.

```
1. NAVIGATE   → browser_navigate(url)         # get the page
2. SNAPSHOT   → browser_snapshot()            # get accessibility tree + refs
3. ACT        → browser_click(ref)            # one element + one action
4. VERIFY     → browser_snapshot()            # re-snapshot after every mutation
5. FIND       → browser_find("text")          # when you need one specific element
```

**Why snapshot, not screenshot?** Snapshots are deterministic, token-lean, and survive refactor. Screenshots are pixel data — non-deterministic, expensive to compare, useless for selecting elements.

**Read the snapshot fully before acting.** It tells you the page state, available elements, and their `ref` IDs. Skim it; don't skip it.

## Tool reference (24 tools in your stack)

> **Tool discovery:** if a tool below is named differently in your MCP, run `tools.$codemode.search({query: "playwright browser"})` to find the actual name. The canonical names from `@playwright/mcp@latest` are listed.

### Navigation

| Tool | Purpose | When to use |
|---|---|---|
| `browser_navigate(url)` | Go to a URL | Always the first step |
| `browser_navigate_back()` | Go back in history | After a form error, after a redirect |
| `browser_resize(width, height)` | Set viewport size | Before screenshot; for mobile emulation |
| `browser_tabs(action, index?)` | List / new / close / select tabs | Multi-app flows (e.g., login + OAuth) |

### Snapshot & inspection

| Tool | Purpose | When to use |
|---|---|---|
| `browser_snapshot()` | Return the accessibility tree with element `ref`s | After navigation, after every mutation |
| `browser_find(text, element?)` | Find a specific element by text/role | Cheaper than full re-snapshot when you know what you need |
| `browser_console_messages()` | Get all console messages | Triage JS errors, warnings, network debug |
| `browser_network_request(url, ...)` | Inspect a specific network request by URL | When you need headers, payload, response |
| `browser_network_requests()` | List all network requests made so far | Post-mortem; "what did the page actually call?" |

### Interaction

| Tool | Purpose | When to use |
|---|---|---|
| `browser_click(ref, element?)` | Click an element | Primary interaction |
| `browser_hover(ref, element?)` | Hover | Triggers tooltips, dropdowns, lazy-load |
| `browser_type(ref, text, element?)` | Type into a focused field | After clicking a text field |
| `browser_fill_form(fields)` | Fill multiple form fields at once | Login, signup, multi-field forms |
| `browser_select_option(ref, values, element?)` | Select dropdown option | `<select>` elements |
| `browser_press_key(key)` | Press a keyboard key | Enter, Tab, Escape, arrows |
| `browser_drag(start, end)` | Drag from one element to another | Reorderable lists, kanban, sliders |
| `browser_drop(ref, dropTarget)` | Drop (after `browser_drag`) | Drag-and-drop targets |
| `browser_file_upload(paths)` | Upload files via file picker | Image upload, document upload |

### Evaluation

| Tool | Purpose | When to use |
|---|---|---|
| `browser_evaluate(fn)` | Run a JS function in page context | Read computed state, query DOM, trigger app APIs |
| `browser_run_code_unsafe(code)` | Run arbitrary JS (more permissive) | When `evaluate` is too restrictive; rarely needed |

### Dialog & wait

| Tool | Purpose | When to use |
|---|---|---|
| `browser_handle_dialog(accept, promptText?)` | Accept or dismiss a native dialog | `alert()`, `confirm()`, `prompt()` |
| `browser_wait_for(text, time?)` | Wait for text to appear, or for a duration | Last resort; prefer snapshot-driven verification |

### Capture

| Tool | Purpose | When to use |
|---|---|---|
| `browser_take_screenshot(filename, fullPage?, type?)` | Save a screenshot to disk | For reports, visual review, or when snapshot is insufficient |
| `browser_close()` | Close the browser | Cleanup at end of session |

## Locator strategies

The hardest part of browser automation is **finding the right element reliably**. The MCP gives you snapshot `ref`s (best), but you also need other strategies.

### Priority order (use the most semantic first)

1. **Snapshot `ref`** — `browser_snapshot` returns refs like `[ref=e42]`. Use these when fresh.
2. **Role + accessible name** — `button:has-text("Sign in")`, `link:has-text("Pricing")`
3. **Label** — `label:has-text("Email")` then `input:near(label)`
4. **Placeholder** — `input[placeholder*="email" i]`
5. **Test ID** — `[data-testid="submit"]` (best practice for app authors)
6. **CSS / XPath** — last resort; brittle to refactor

**Always prefer role/label/text** over CSS/XPath. Roles change rarely; structure does.

### In the MCP: ref lifecycle

Refs are **one-shot** — a page re-render invalidates them. Always re-snapshot before the next action.

```
1. snapshot          → [ref=e42] is the "Sign in" button
2. click [ref=e42]   → click happens
3. snapshot          → new refs (e42 may now point to a different element)
```

If you get "element not found":
1. Re-snapshot (the page changed)
2. `browser_find` for the text you expected
3. If truly absent, check that the previous action succeeded (network? console?)

### In @playwright/test: locators

```typescript
// Best: page object + role
await page.getByRole('button', { name: 'Sign in' }).click();

// By label
await page.getByLabel('Email address').fill('user@example.com');

// By placeholder
await page.getByPlaceholder('you@example.com').fill('user@example.com');

// By test ID
await page.getByTestId('submit-button').click();

// By text (last resort for non-interactive)
await expect(page.getByText('Welcome back')).toBeVisible();
```

## Snapshot ref lifecycle

**Refs are page-render scoped, not session scoped.** Re-render = re-snapshot.

| Event | Refs still valid? |
|---|---|
| Click → same page, no re-render | **Yes** (sometimes) |
| Click → same page, partial re-render | **No** for changed elements |
| Click → new page / full re-render | **No** |
| Form submit → new page | **No** |
| Scroll | **Yes** (usually) |
| Tab switch | **No** (new tab = new tree) |
| `browser_navigate` to new URL | **No** |

**Rule:** after every action that might change the page, **re-snapshot before the next action**. This is non-negotiable.

## Multi-step & failure recovery

### Recovery playbook

1. **"Element not found":** re-snapshot (the page changed), or `browser_find` the text. If truly absent, check the previous action succeeded (network? console?).
2. **Overlay / cookie banner intercepting a click:** re-snapshot, dismiss the dialog (`browser_handle_dialog` for native dialogs), then retry.
3. **iFrames:** the snapshot exposes frame subtrees; target refs inside the frame explicitly.
4. **Console errors during navigation:** capture with `browser_console_messages()`, then re-navigate to a clean state.
5. **After 2 failed retries, stop and reconsider the page state** instead of repeating the same call.

### Multi-step task shape

```markdown
Goal: Add 3 todos to the demo todo app.

1. navigate to https://demo.playwright.dev/todomvc
2. snapshot → find "What needs to be done?" input
3. type "Buy milk" + Enter
4. snapshot → verify item appears
5. type "Walk dog" + Enter
6. snapshot → verify second item
7. type "Read book" + Enter
8. snapshot → verify three items
```

**Each step ends with verification.** If verification fails, recover; don't continue blindly.

## Form patterns

### Multi-field form (login, signup, search)

**Use `browser_fill_form`** for many fields at once:

```javascript
// The fields parameter is an array of {name, type, value, ref}
await tools.playwright.browser_fill_form({
  fields: [
    {name: "Email",    type: "textbox",  value: "user@example.com", ref: "[ref=e10]"},
    {name: "Password", type: "textbox",  value: "secret123",       ref: "[ref=e12]"},
    {name: "Remember", type: "checkbox", value: "true",            ref: "[ref=e14]"}
  ]
});
```

For a single field, use `browser_type` after a `browser_click` on the input.

### File upload

```javascript
// Click the upload button → file picker opens
// browser_file_upload takes absolute paths
await tools.playwright.browser_file_upload({
  paths: ["/home/work/Downloads/invoice.pdf"]
});
```

**For hidden file inputs** (CSS `display: none`), use `browser_evaluate` to set the input directly:
```javascript
const input = document.querySelector('input[type="file"]');
input.style.display = 'block';
```

### Dropdowns (`<select>`)

```javascript
await tools.playwright.browser_select_option({
  ref: "[ref=e22]",
  values: ["nepal"],
  element: "Country dropdown"
});
```

For custom dropdowns (ARIA `listbox`), click to open, then `browser_find` and click the option.

### Date pickers, sliders, rich inputs

These are usually custom widgets. The pattern:
1. Click the field to open the picker
2. Snapshot to see the picker's structure
3. Click the desired day/option
4. Verify

If the picker is stubborn, fall back to `browser_evaluate` to set the value directly and dispatch a change event.

## Authentication patterns

### Simple login (username/password)

```
1. Navigate to /login
2. Fill email + password
3. Click "Sign in"
4. Snapshot → verify redirect to /dashboard
5. (For repeated sessions) save the auth cookie or storage
```

### Session persistence across MCP sessions

**Option A: cookies** — export after login, restore in next session
```javascript
// After login, dump cookies
const cookies = await tools.playwright.browser_evaluate(() => document.cookie);

// On next session, navigate then set
// (depends on MCP capability; if not available, re-login each time)
```

**Option B: storage state** — for @playwright/test, use `storageState` (file-based)
```typescript
// First time: save state
await page.context().storageState({ path: 'auth.json' });

// Subsequent runs: load state
test.use({ storageState: 'auth.json' });
```

### 2FA / OTP

- **OTP via SMS** — out of scope for an agent; ask the user
- **TOTP (authenticator app)** — read the code from the user's authenticator; pass it to the page
- **Email magic link** — fetch from the user's mailbox (use the email MCP if available)
- **OAuth popup** — `browser_tabs` to handle the popup; OAuth flow often needs a human for consent

**Always prefer a test/staging account with predictable credentials** for agent automation.

## Advanced interactions

### Drag and drop

```javascript
// Two-arg form
await tools.playwright.browser_drag({
  start: "[ref=e42]",  // source
  end:   "[ref=e50]"   // target
});

// Or as separate drag + drop
await tools.playwright.browser_drop({
  ref: "[ref=e42]",
  dropTarget: "[ref=e50]"
});
```

**If the drag is a "native" HTML5 drag** (rare), this works directly. If it's a **pointer-based** drag (most modern apps), Playwright simulates the pointer events correctly. If it's a **library** drag (e.g., react-dnd, dnd-kit), test with the library's API in `browser_evaluate`.

### Multi-tab flows

```javascript
// List tabs
const tabs = await tools.playwright.browser_tabs({action: "list"});

// Open a new tab
const newTab = await tools.playwright.browser_tabs({action: "new", url: "https://..."});

// Select tab
await tools.playwright.browser_tabs({action: "select", index: 1});

// Close tab
await tools.playwright.browser_tabs({action: "close", index: 1});
```

**Use case:** OAuth login flow (popup), or comparing two pages side by side.

### JavaScript evaluation

```javascript
// Read page state
const result = await tools.playwright.browser_evaluate({
  function: "() => ({ title: document.title, items: document.querySelectorAll('li').length })"
});

// Trigger app APIs
await tools.playwright.browser_evaluate({
  function: "() => { window.__appState.user.isLoggedIn = true; }"
});

// Scroll
await tools.playwright.browser_evaluate({
  function: "() => window.scrollTo(0, document.body.scrollHeight)"
});
```

**Use `browser_evaluate` for:**
- Reading computed state the DOM doesn't expose
- Triggering app-level methods (React DevTools-style)
- Setting values that won't accept type/click
- Performance metrics (`performance.timing`, `PerformanceObserver`)

**Avoid `browser_run_code_unsafe` unless the standard `evaluate` blocks it.**

### Dialogs

```javascript
// Native alert/confirm/prompt
await tools.playwright.browser_handle_dialog({accept: true});
// or
await tools.playwright.browser_handle_dialog({accept: false, promptText: "user input"});
```

**Set the handler BEFORE the action that triggers it** (it's a one-shot).

## Network & console

### Inspect requests

```javascript
// All requests made so far
const reqs = await tools.playwright.browser_network_requests();

// One specific request
const req = await tools.playwright.browser_network_request({
  url: "https://api.example.com/v1/users",
  // method, status, requestHeaders, responseHeaders, postData, responseBody
});
```

**Use for:** finding the actual API the page calls (better than scraping DOM), debugging auth issues, finding rate limits, inspecting payloads.

### Console messages

```javascript
const messages = await tools.playwright.browser_console_messages();
// Filter for level: "error", "warning", "log", "info", "debug"
```

**Triage order:**
1. **Errors** — JS errors, 404s, 500s → usually the root cause
2. **Warnings** — deprecations, React warnings → often benign but worth checking
3. **Logs / info / debug** — usually app telemetry; ignore unless debugging

### Mocking network (in @playwright/test, not MCP)

```typescript
test('shows error on 500', async ({ page }) => {
  await page.route('**/api/users', route => 
    route.fulfill({ status: 500, body: 'Server error' })
  );
  await page.goto('/dashboard');
  await expect(page.getByText('Server error')).toBeVisible();
});
```

For MCP-driven testing, you'd use `browser_evaluate` to override `fetch` (fragile; prefer the test framework for this).

## E2E test generation & execution (@playwright/test)

> **Use @playwright/test for tests that must run on every commit** (CI). Use the MCP for ad-hoc exploration and one-off scraping.

### Project setup

```bash
npm init playwright@latest
# or
pnpm create playwright
```

Creates:
- `playwright.config.ts`
- `tests/` (with example)
- `playwright/` (HTML reporter, traces)

### `playwright.config.ts` (the canonical 2026 config)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['github']  // for CI
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',  // capture trace only when retrying
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
```

### Page Object Model (POM)

```typescript
// pages/login.page.ts
import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async assertError(message: string) {
    await expect(this.page.getByRole('alert')).toContainText(message);
  }
}
```

### Test

```typescript
// tests/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test('successful login redirects to dashboard', async ({ page }) => {
  const login = new LoginPage(page);
  await page.goto('/login');
  await login.login('user@example.com', 'correctpassword');
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});

test('invalid password shows error', async ({ page }) => {
  const login = new LoginPage(page);
  await page.goto('/login');
  await login.login('user@example.com', 'wrong');
  await login.assertError('Invalid credentials');
});
```

### Patterns that prevent flaky tests

- **Use `auto-retrying assertions** — `expect(locator).toBeVisible()` retries until the assertion passes or times out
- **Never `waitForTimeout()`** — always wait for an actionable state
- **Fresh context per test** — no shared state between tests (`test.use({ storageState: undefined })`)
- **Mock external APIs** — `page.route()` for anything outside your control
- **Seed/clean the database in `beforeEach`** — don't rely on shared data
- **Don't grow the E2E layer** — 3–10 critical journeys, not 200 tests
- **Trace on retry only** — keeps artifacts small

### Running

```bash
# Local
npx playwright test
npx playwright test --ui          # UI mode (great for debugging)
npx playwright test --debug       # step-by-step

# Single test
npx playwright test tests/auth.spec.ts:5

# Single browser
npx playwright test --project=chromium

# Update snapshots (visual regression)
npx playwright test --update-snapshots
```

### Reading failures

- Open the HTML report: `npx playwright show-report`
- Inspect the trace: `npx playwright show-trace trace.zip`
- Re-run a single failing test with `--debug`

## Accessibility testing (axe-core)

> **Accessibility is a first-class concern.** Run `@axe-core/playwright` against key pages to catch WCAG violations.

### Setup

```bash
npm i -D @axe-core/playwright
```

### Usage in a test

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home page has no critical a11y violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
});
```

### Best practices

- **Separate test suite** for a11y (it's slow; don't run on every commit)
- **Use tags** to focus on what matters (`wcag2aa` is the legal minimum in most places)
- **Filter by impact** — `critical` and `serious` are usually must-fix
- **Run on key pages** — landing, signup, checkout, dashboard
- **Don't fix and forget** — re-run after UI changes; add a11y to the PR template

### Common violations (and fixes)

| Violation | Fix |
|---|---|
| Missing alt text on images | `alt` attribute on every `<img>` |
| Missing form labels | `<label for="x">` or `aria-label` |
| Low color contrast | Use a contrast checker; aim for 4.5:1 |
| Missing landmark roles | `<main>`, `<nav>`, `<header>` structure |
| Buttons without accessible name | Text or `aria-label` on every button |
| Headings out of order | One `<h1>` per page; don't skip levels |

## Visual regression

> **Compare screenshots** across runs to catch unintended visual changes.

### Setup (in @playwright/test)

```typescript
// playwright.config.ts
expect: {
  toHaveScreenshot: {
    maxDiffPixelRatio: 0.02,  // 2% pixel difference allowed
    threshold: 0.2,            // color difference threshold
  },
},
```

### Usage

```typescript
test('home page visual', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
});
```

### Best practices

- **Snapshot key states** (logged in, logged out, error, empty)
- **Use `mask`** to hide dynamic content (timestamps, user-specific data)
- **Don't snapshot the entire app** — too many false positives
- **Review diffs carefully** — auto-approve is dangerous
- **Re-snapshot only intentional changes** — `--update-snapshots`

### Common pitfalls

- ❌ Snapshots with dynamic data (timestamps, ads) — masks first
- ❌ Cross-OS font rendering differences — run on one OS in CI
- ❌ Anti-aliasing differences — bump `maxDiffPixelRatio` slightly

## Cross-browser, mobile, performance

### Cross-browser testing

```typescript
// playwright.config.ts
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
],
```

**When to add a browser:** when a customer reports a bug there. Don't test 12 browsers upfront.

### Mobile emulation

```typescript
// Resize viewport + set device
await page.setViewportSize({ width: 375, height: 812 });
await page.emulateMedia({ media: 'screen' });

// Or use a device profile
test.use({ ...devices['iPhone 14'] });
```

### Network throttling / performance

```typescript
// Throttle to "Slow 3G"
await page.route('**/*', async (route) => {
  await new Promise(r => setTimeout(r, 500));
  await route.continue();
});

// Or use CDP for realistic throttling
const client = await page.context().newCDPSession(page);
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  downloadThroughput: 1.6 * 1024 * 1024 / 8,  // 1.6 Mbps
  uploadThroughput: 750 * 1024 / 8,
  latency: 150,
});
```

**Use for:** testing loading states, skeleton screens, error handling, retry logic.

## CI integration

### GitHub Actions (canonical 2026 setup)

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

### Sharding for speed

```bash
# In CI: split tests across machines
npx playwright test --shard=1/4
npx playwright test --shard=2/4
# etc.
```

### Best practices

- **Run E2E only on main + PRs** (not every push)
- **Block merge on E2E failure** (branch protection)
- **Upload artifacts** (report + traces) for postmortem
- **Cache `~/.cache/ms-playwright`** for faster runs
- **Use `webServer`** to spin up your app in the test
- **Don't run E2E on every commit** if it's slow — nightly + on-merge is fine

## Failure modes & debugging

### Common failure patterns

| Symptom | Likely cause | Fix |
|---|---|---|
| "Element not found" | Page re-rendered; ref stale | Re-snapshot |
| "Element not visible" | Off-screen, hidden by overlay, `display: none` | Scroll into view; check for overlay |
| "Timeout waiting for selector" | Selector wrong, element never appears, async load | Verify selector in DevTools; add wait for text |
| "Navigation failed" | Bad URL, network, auth | Check `browser_console_messages`; check `browser_network_requests` |
| Click did nothing | Stale ref, click intercepted, wrong element | Re-snapshot; check for overlays |
| Test passes locally, fails in CI | Timing, environment, data, parallelism | Add `await`; check env vars; review trace |
| Test is flaky | Shared state, race condition, bad wait | Fresh context; replace `waitForTimeout` with actionable wait |

### Debugging recipe

1. **Re-run with `--debug`** to step through
2. **Open the trace** (`show-trace trace.zip`) — see the network, console, DOM at every step
3. **Add `await page.screenshot({ path: 'debug.png' })`** at the failing step
4. **Add `await page.pause()`** to manually inspect
5. **Run in headed mode** to see what's happening

## When to use MCP vs @playwright/test

| Use case | Use |
|---|---|
| One-off research / scraping | **MCP** |
| "Find the X button on this page" | **MCP** |
| "Fill out this form once" | **MCP** |
| Ad-hoc testing while building | **MCP** (then convert to @playwright/test) |
| CI gate / every-commit tests | **@playwright/test** |
| Page object model / fixtures | **@playwright/test** |
| Cross-browser matrix | **@playwright/test** |
| Visual regression | **@playwright/test** |
| A11y scanning | **@playwright/test** |
| Load / performance | **@playwright/test** + k6 or Artillery |

**Workflow:** explore with MCP → codify the working flow as @playwright/test → commit.

## Tools in our stack

- **Playwright MCP** (`@playwright/mcp@latest`) — agent's interactive browser
- **@playwright/test** — CI-runnable test framework
- **@axe-core/playwright** — accessibility testing
- **@playwright/test UI mode** (`--ui`) — local debugging
- **Trace viewer** — postmortem
- **Dev server** (vite, next, etc.) + Vite proxy for `/api` during dev
- **CI**: GitHub Actions (canonical) with `actions/upload-artifact` for reports
- **Skills:** `domain-orchestrator` (routing), `development-workflows` (for E2E in build pipelines), `deep-research` (for research that needs browsing)

## Common mistakes

- ❌ **Screenshot-decision loop** — images are token-heavy and non-deterministic; use snapshots
- ❌ **Click without re-snapshot** — refs are one-shot
- ❌ **Raw `setTimeout` waits** — use actionable waits
- ❌ **XPath/CSS for stable locators** — prefer role/label/testid
- ❌ **Shared test state** — fresh context per test
- ❌ **E2E for unit-testable logic** — keep E2E small
- ❌ **No `trace: 'on-first-retry'`** — you'll regret it when CI fails
- ❌ **Pinning to one browser** — at least Chromium + WebKit for "does it work on Mac?"
- ❌ **Test ordering dependencies** — tests should be runnable in any order
- ❌ **Sensitive data in test artifacts** — mask; use test accounts
- ❌ **Skipping visual regression** because "we don't need it" — you'll catch CSS regressions
- ❌ **Treating a11y as nice-to-have** — legal risk + the right thing
- ❌ **Leaving a headless browser running** — close when done
- ❌ **Logging in on every test** — use `storageState` for shared auth
- ❌ **Mocking too much** — you're testing your mocks, not your app
- ❌ **MCP for CI** — MCP is for the agent; @playwright/test is for CI

## Guardrails

- **Never** click blind targets — work from snapshot ref
- **Never** commit sensitive data (PII, secrets) to test artifacts
- **Never** run destructive operations without confirmation (delete accounts, post content)
- **Always** close the browser when done
- **Always** log significant actions (for debugging)
- **Always** prefer role/label/text over CSS/XPath

## Related skills

- `domain-orchestrator` (routing), `development-workflows` (E2E in build), `deep-research` (research that needs browsing)
