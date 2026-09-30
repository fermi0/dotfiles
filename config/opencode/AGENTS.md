# AGENTS.md — Global Agent Context for OpenCode

Rules and non-derivable facts only. Detail lives in `RUNBOOK.md`.

## User

- **K** — Nepal, UTC+5:45, currency NPR. English (business) + Nepali (native).
- Lenovo Legion 5: Ultra 9 275HX, RTX 5060 8GB, 32GB RAM, 2560x1600@240. EndeavourOS (Arch), Hyprland 0.56, zsh, kitty.
- Focus: starting a business in Nepal; scouting opportunities.

## Working rules

- Evidence only. No pseudoscience. Run it, don't infer. Say when something is unverified.
- Read before write.
- The filesystem is the system of record, not the chat.
- Confirm before delete, post, send, move, push. Back up before editing config.
- Never break anything that locks the user out of their laptop — auth, login, disk encryption, bootloader.
- Never break anything that locks the user out of opencode — config, auth, plugins, MCP.
- Read a target project's AI/contribution policy before posting on the user's behalf.
- Files the user edited are user-authored.
- Delete via `gio trash` only. Never `rm`. Never empty Trash.
- Never commit `.env` or `*poorguy-ratelimit.jsonc*`.
- Never truncate output the task needs; read the spilled file.
- Plan multi-step or ambiguous work with `sequential-thinking` first.
- Batch ≥3 calls, filtering, or large output through Code Mode `execute`.
- Discover tools with Code Mode `search`. Never guess a path.

## Memory (lemma)

- `memory_read` at session start, `memory_add` at end, `session_attempt` for dead ends. Never ask to save.
- Objection → `memory_feedback(useful: false)`. Praise → `useful: true`. One per event, specific, `memory_relate` it.

## OpenCode v2

- `Model.Info`: `id` = registry key (`/models`, `-m`), `modelID` = sent upstream. Override both when cloning across providers. `Model.Ref` has `id`.
- Code Mode `execute()` returns `{content}`. `out()` only inside `execute`.
- Commenting out a plugin does not disable it; v2 auto-discovers `plugin/` and `plugins/`. `gio trash` the dir, then `opencode service restart`.
- `opencode plugin list` / `debug config` report the running daemon, not disk.
- Config edits do NOT hot-reload: `Config.reconcileWatches` fails with `inotify_add_watch ... Not a directory` (verified in `opencode.log`, recurring since 2026-09-27). Restart the server for a config change to take effect.
- Never enable a plugin that mutates a live request path to debug it. Instrument the existing path, inert and append-only.

## Infra

- Vault: `/home/shared/Zurnel`; rules in `Zurnel/AGENTS.md`; read the index before placing. `obsidian-rest` needs Obsidian running.
- Web: native `websearch` + `webfetch`.
- Browser: native `browser` only. Not signed in — use `gh auth login` or a PAT.
- playwright MCP is disabled in **both** `~/.config/opencode/opencode.jsonc` and each project's `opencode.json`. Disabling one is not enough: the project file overrides the global.
- Hyprland config is Lua. `hyprctl dispatch` and `hyprctl keyword` are dead in 0.56. Read `configs/WindowRules.lua` before touching window rules.
- Ops runbook: `~/.config/opencode/RUNBOOK.md`.
