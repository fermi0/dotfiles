---
created: 2026-09-09
---

# OpenCode Ops Runbook

Moved out of `AGENTS.md` (2026-09-09) to keep the system prompt lean. Load this when doing plugin/config maintenance or post-upgrade checks.

## Plugin Stack (8+1)

| Plugin | Role |
|---|---|
| `opencode-token-optimizer` | Context/token efficiency (rtk, dedup, read-compact, 120-char wrap, Code Mode nudge) |
| `opencode-poorguy-ratelimit` | Free-provider rate limiting (config: `opencode-poorguy-ratelimit.jsonc`) |
| `opencode-rate-limit-retry` | Retry on 429 |



| `opencode-scheduler` | Cron-style scheduled jobs |
| `opencode-sentinel` | Background process monitors |

| `@openspoon/subtask2` | Subtask delegation |

| `@fleetingecho/opencode-handoff` | Session handoff/persistence |
| `notify-essentials.js` | Notifications (auto-discovered) |

## Diagnostics

- `opencode debug config` — resolved config (plugins, MCPs, instructions)
- `journalctl --user -u llama-server@ornith` — local model server logs (prefill/eval timings per request)
- `plugin_health` tool — plugin load status
- `sqlite3 ~/.local/share/opencode/opencode.db` — session/message DB (token usage per message in `data` JSON)

## Post-`pacman -Syu` Checklist

1. `opencode --version` launches clean
2. `plugin_health` — all plugins load
3. llama-server: `systemctl --user restart llama-server@ornith`, then `curl -s 127.0.0.1:1234/health`
4. If CUDA broke: rebuild llama.cpp (`cmake --build build-cuda -j 20 --target llama-server`); rollback build at `~/apps/llama.cpp/build-cuda-old-20260822`
5. MCP smoke test: searxng search + lemma `memory_read`

## Anti-Truncation Protocol (details)

- Never truncate bash output with `head`/`tail` when the full output matters; the harness captures overflow to a file automatically — read that file with offset/limit instead.
- Wrap long lines ≤120 chars when generating files.
- For files >200KB, use `read_smart` or Code Mode `execute` (chunked reads), never a raw full-file dump into context.

## Config Layout

- Global: `~/.config/opencode/opencode.jsonc` (+ `AGENTS.md` auto-loaded)
- Lean local: `~/.config/oc-local/opencode/opencode.jsonc` (XDG-isolated; alias `oc-local`)
- Backups: `~/.config/opencode/backups/`
- llama-server: `~/.local/bin/llama-serve` (+ `llama-warmup`, `llama-save-slots`), systemd user unit `llama-server@.service` (drop-in in dotfiles repo)
