# AGENTS.md — Global Agent Context for OpenCode

## User Profile

- **K** — Nepal, UTC+5:45, currency NPR
- English (business) + Nepali (native)
- Lenovo Legion 5: Ultra 9 275HX (24C), RTX 5060 8GB, 32GB RAM — EndeavourOS, Hyprland, zsh
- Focus: starting a business in Nepal; scouting opportunities

## Workflow Preferences

- **No pseudoscience** — Scientific method, Evidence-based only.
- **Read before write** — never overwrite a file you haven't read this session.
- **Save to disk, not chat** — the filesystem is the system of record.
- **Confirm before destructive ops** — delete, post, send, move, push.
- **User owns the file** — treat files the user edited as user-authored.

## Feedback Loop (lemma memory)

- Capture signals IMMEDIATELY: frustration/anger/confusion/objection → `memory_feedback(useful: false)` or `memory_add` (lesson/warning); praise/thanks/trust/laughter → `memory_feedback(useful: true)`. One per event, be specific, `memory_relate` to the relevant fragment.
- Session start: `lemma.memory_read`. Session end: `memory_add` new insights; `session_attempt` for dead ends.

## Reasoning & Tool Use

- **Complex/ambiguous multi-step work**: think first with the `sequential-thinking` MCP before acting; revise the plan there as facts arrive instead of improvising mid-execution.
- **Batched tool work** (≥3 calls, filtering/aggregating results, large files): use Code Mode `execute` — one round trip, process locally, return only the summary.
- **Tool discovery**: in Code Mode, find any capability with `await tools.$codemode.search({ query: "<intent + key nouns>" })`, then call the exact path it returns. Never guess tool paths.

## Tools & Infra

- **Vault**: `/home/shared/Zurnel` (Obsidian, via obsidian-rest MCP). Vault rules: `/home/shared/Zurnel/AGENTS.md`.
- **Web**: opencode's NATIVE `websearch` (default Tinyfish; providers exa/firecrawl/parallel/tavily/tinyfish, no API key
            needed) + native `webfetch`. searxng MCP removed 2026-09-28 as redundant.
- **Browser**: opencode's NATIVE `browser` (45 tools) WORKS here — verified 2026-09-30 by opening real tabs
            (example.com, hypr.land, github.com). The earlier claim that it was a dead end needing the OpenCode
            Desktop app was wrong; do not repeat it without testing. Two real limits: (1) the profile is NOT signed
            in to anything — github.com redirects to /login, so anything needing auth needs the user to log in
            themselves; (2) the return shape is the tab object itself (`r.id`, `r.title`), NOT `r.output.id` —
            reading the wrong path makes a working call look like a failure. There is no playwright MCP on this box
            and no `gh`-style CLI unless installed, so prefer NATIVE `browser` + the `gh` CLI (or a PAT) for
            anything authenticated.
- **Large files/output**: use `read_smart` or Code Mode `execute`; never dump >200KB into context; wrap long lines ≤120 chars; never truncate bash output.
- **Ops runbook** (plugin stack, post-`pacman -Syu` checks, diagnostics, backups): `~/.config/opencode/RUNBOOK.md`.

## OpenCode v2 gotchas (learned the hard way — RUNBOOK.md has detail)

- **`Model.Info` has TWO id fields.** `id` = registry key (what `/models` lists, what `-m` takes); `modelID` = the string
            actually sent upstream. Cloning a model across providers must override BOTH, or it looks fine in the picker
            and 404s on every call.
- **`Model.Ref` (session hooks) has `id`, not `modelID`.** `event.model.modelID` is `undefined`.
- **v2 tool `execute()` must return `{content}`** (a bare string throws `"output" in s`); the `out()` wrapper belongs
            only in `execute`, never in a helper that returns a string.
- **Commenting a plugin out of the `plugins` array does NOT disable it** — v2 auto-discovers `plugin/` and `plugins/`.
            To disable: `gio trash` the dir, then `opencode service restart`.
- **Tool definitions are ~89% of input context** (measured: 9,938 vs 1,107 tokens, one-word prompt). The agent
            `tools: {"*": false}` map is the only switch that strips them; `permission: deny` and `tool_call: false`
            still send the schemas.
- **`aisdk` hooks never fire.** Use `ctx.session.hook("http.request" | "http.response" | "retry")`.
- **`opencode plugin list` / `opencode debug config` report the RUNNING daemon, not disk** — a stale daemon makes a
            correct config edit look ineffective.
- **Per-agent `model` works only for CUSTOM agents.** Built-in build/summary/compaction ignore `agent.<name>.model`;
            pin them with the top-level `"model"` key (`provider/model#variant`, or an object with `variant`).

## Safety

- Backup before modifying config. Never commit `.env` or `*poorguy-ratelimit.jsonc*`.
- Delete via `gio trash` only; NEVER `rm`; NEVER empty Trash.
- **Never enable a plugin in the live config that mutates a live request path** (auth headers, model ids, bodies) for
            debugging. Instrument the EXISTING plugin's own code path with inert, append-only, try/catch logging. A
            diagnostic on the auth path broke opencode globally on 2026-09-27.
