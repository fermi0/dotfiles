---
created: 2026-09-09
modified: 2026-09-28
---

# OpenCode Ops Runbook

Moved out of `AGENTS.md` (2026-09-09) to keep the system prompt lean. Load this when doing plugin/config maintenance or
post-upgrade checks.

## Plugin Stack (6)

All are **native v2 ports** at `~/.config/opencode/plugins/<name>-v2/index.ts`, listed in the `plugins` array of
`opencode.jsonc` (note: `plugins`, not v1's `plugin`). v2 also auto-discovers `plugin/` and `plugins/`, so a plugin
stays loaded even when commented out of that array.

| Plugin | Role |
|---|---|
| `opencode-token-optimizer` | Context/token efficiency: dedup, read-compact, 120-char wrap, Code Mode nudge. Provides the `plugin_health` + `read_smart` tools |
| `opencode-poorguy-ratelimit` | Free-provider key rotation, rpm/rpd limits, per-model 404/402 cooldowns, circuit breaker. Config: `opencode-poorguy-ratelimit.jsonc` |
| `opencode-auto-free` | Curates the free-model list per provider (live probe + capability scoring). Config: `auto-free/config.json` |
| `opencode-sentinel` | Background process monitors (`sentinel_monitor` / `_stop` / `_list` / `_ping` / `_spike`) |
| `subtask2` | Subtask delegation across subagents |
| `opencode-handoff` | Session handoff / cross-session state persistence |

**Retired 2026-09-28**: `opencode-rate-limit-retry` (folded into poorguy), `opencode-scheduler`,
`notify-essentials` (do not use). The v1 `plugin-lib/` shims are gone — v1 and v2 event shapes are incompatible, so
each plugin was ported to the native v2 API rather than shimmed.

## Regression Harnesses (run after ANY plugin edit)

```bash
cd ~/.config/opencode
bun ~/scripts/audit-opencode-plugins.ts       # all 6 ports load + id===modelID guard
bun ~/scripts/test-poorguy-v1-mechanics.ts    # rotation, 404/402 scoping, retry, rpd
bun ~/scripts/test-token-optimizer-roundtrip.ts
bun ~/scripts/audit-tui-plugins.ts            # TUI plugin
```

`audit-opencode-plugins.ts` asserts every injected model has `id === modelID` and carries no OpenRouter-style `:free`
suffix. That invariant was violated in production (2026-09-27) and 404'd on every call while looking correct in the
picker. It prints "identity check vacuous" when nothing was injected, so a no-op check cannot pass silently, and it is
offline/deterministic (real openrouter catalog + pre-seeded probe cache).

## Diagnostics

- `opencode debug config` / `opencode plugin list` — **report the RUNNING daemon, not disk.** After editing config you
            must `opencode service restart` to see the change; a stale daemon makes correct edits look ineffective.
- `opencode run --format json -m <model> "<msg>"` — event stream. Session token usage (for measuring context cost)
            comes from `GET /api/session/<id>/message`, field `tokens`.
- `GET /api/model` — full `Model.Info` per model; compare `id` vs `modelID`.
- `GET /api/plugin` — per-plugin `error` field (0 = healthy). `/api/agent` — agent models. `/api/mcp` — MCP status.
            All need HTTP basic auth: `opencode:<password from ~/.config/opencode/service.json>`.
- `~/.config/opencode/poorguy-v2.log`, `auto-free-v2.log` — inert per-request diagnostics (append-only, safe).
- `sqlite3 ~/.local/share/opencode/opencode.db` — session/message DB, plus plugin storage in `kv`
            (`plugin:<hex>:seen` / `:tested` / `:last-run`). `tested` is a 24h probe cache; delete that row to force
            re-probing after changing probe logic.
- `plugin_health` tool — plugin load status. MCP-based, so a server restart can abort it; the CLI is the fallback.
- `journalctl --user -u llama-server@ornith` — local model server logs (prefill/eval timings per request)

## Provider Notes

- **auto-free** live-probes openrouter/kilo/zai/nim (`live: true`); `opencode` stays on the static catalog because its
            zen service exposes no `baseURL`/`apiKey` in config — the plugin reports a `liveNote` rather than
            hardcoding an endpoint. Probing is bounded to `keep` + top `maxModels`, so a cold cache costs ~32 probes,
            not ~400.
- **A single API key failing does not mean a model is dead.** 402/401/403/404 are key-scoped (OpenRouter accounts can
            whitelist `allowed-providers`; each key has its own credit). Models are retired only when the provider says
            the model itself is unavailable. One of the 7 openrouter keys is whitelisted and 404s on `stealth/*` while
            the others serve it with 200.
- **poorguy** rotates keys per request independently of which model is selected. Cooldowns persist to
            `~/.config/opencode/.poorguy-claims/<provider>.state.json`; expired entries are never resurrected.

## Post-`pacman -Syu` Checklist

1. `opencode --version` launches clean
2. `bun ~/scripts/audit-opencode-plugins.ts` — all ports pass
3. `opencode service restart && opencode plugin list` — 6 plugins, no failures
4. llama-server: `systemctl --user restart llama-server@ornith`, then `curl -s 127.0.0.1:1234/health`
5. If CUDA broke: rebuild llama.cpp (`cmake --build build-cuda -j 20 --target llama-server`); rollback build at
            `~/apps/llama.cpp/build-cuda-old-20260822`
6. Smoke test: lemma `memory_read` + a native `websearch` call (needs no API key)

## MCPs

Global session exposes: `context7`, `lemma`, `sequential-thinking`, `sqlite`, plus opencode's own
`browser` / `read_smart` / `sentinel_*` / `plugin_health` / `poorguy_reset` tool groups. `playwright` and
`obsidian-rest` are project-scoped (e.g. `~/projects/saksham/opencode.json`) and are NOT in a global
session — check a project's own config before assuming they are there.

Removed 2026-09-28: `searxng` — opencode's NATIVE `websearch` covers search and defaults to Tinyfish with no API key
(verified live), and native `webfetch` covered its `web_url_read`.

### Browser: the native `browser` tool works here (correction, 2026-09-30)

The earlier note in this file claimed the native `browser` tool was dead without the OpenCode Desktop app.
**That was wrong.** Verified live on 2026-09-30 by opening real tabs (`example.com`, `hypr.land`,
`github.com`). The real constraints are narrower:

- It needs a connected browser (the desktop app, or `opencode pair` if you install it). There is no config
  key to disable it — `config.browser` does not exist — so its 45 tool definitions ride along in every request.
- **The profile is not signed in to anything.** `github.com` redirects to `/login`, so any authenticated work
  needs the user to log in themselves, or a separate credential path (`gh auth login`, or a PAT in a file).
- The return value is the tab object itself — read `r.id` / `r.title`, **not** `r.output.id`. Getting that
  path wrong makes a working call look like a failure, which is how the "it's broken" myth started.

Keep `playwright` in the project configs that use it; do not remove it on the grounds that native browser
covers those cases — native browser is unsigned-in and is not a drop-in replacement.

## Anti-Truncation Protocol (details)

- Never truncate bash output with `head`/`tail` when the full output matters; the harness captures overflow to a file
            automatically — read that file with offset/limit instead.
- Wrap long lines ≤120 chars when generating files.
- For files >200KB, use `read_smart` or Code Mode `execute` (chunked reads), never a raw full-file dump into context.

## Config Layout

- Global: `~/.config/opencode/opencode.jsonc` (+ `AGENTS.md` auto-loaded). `~/.config/opencode` is a symlink to
            `/home/shared/dotfiles/config/opencode`, so edits are shared with the git-tracked dotfiles.
- Lean local: `~/.config/oc-local/opencode/opencode.jsonc` (XDG-isolated; alias `oc-local`)
- Backups: `~/.config/opencode/backups/`
- llama-server: `~/.local/bin/llama-serve` (+ `llama-warmup`, `llama-save-slots`), systemd user unit
            `llama-server@.service` (drop-in in dotfiles repo)
