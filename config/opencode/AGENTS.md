# AGENTS.md — Global Agent Context for OpenCode

Rules and non-derivable facts only. Mechanics and long-form detail belong in
`RUNBOOK.md` (read on demand). Tool capabilities are discoverable: in Code Mode
find them with `await tools.$codemode.search({ query: "<intent + key nouns>" })`
and call the exact path it returns. Never guess a tool path.

## User

- **K** — Nepal, UTC+5:45, currency NPR. English (business) + Nepali (native).
- Lenovo Legion 5: Ultra 9 275HX (24C), RTX 5060 8GB, 32GB RAM, 2560x1600@240.
  EndeavourOS (Arch), Hyprland 0.56, zsh, kitty.
- Focus: starting a business in Nepal; scouting opportunities.

## Working rules

- **Evidence only.** No pseudoscience. Verify by running the thing; say plainly
  when something is unverified instead of implying it was checked.
- **Read before write** — never overwrite a file unread this session.
- **The filesystem is the system of record**, not the chat.
- **Confirm before** delete, post, send, move, push. Back up before editing config.
- Having a credential is not permission. Before posting anything on the user's behalf to a third-party
  tracker (GitHub issues, discussions, forums), read that project's AI/contribution policy first — many
  forbid AI-authored posts and sanction the *account*, not the tool. Being logged in says nothing.
- Files the user edited are user-authored — investigate before changing them.
- **Delete via `gio trash` only.** Never `rm`, never empty Trash.
- Never commit `.env` or `*poorguy-ratelimit.jsonc*`.
- Never truncate output the task depends on (bash `head`/`tail`): the harness
  spills it to a file — read that with offset/limit. Wrap generated lines ≤120 chars.
- Complex or ambiguous multi-step work: plan with the `sequential-thinking` MCP
  first, then revise the plan as facts arrive rather than improvising mid-execution.
- Batch ≥3 tool calls, or anything that filters/aggregates/large output, through
  Code Mode `execute` — one round trip, return only the summary.

## Memory (lemma)

- Read at session start, write at session end. `memory_add` for findings,
  `session_attempt` for dead ends. Never ask permission to save.
- Act on signals: frustration or objection → `memory_feedback(useful: false)` or a
  `lesson`/`warning` fragment; praise or trust → `memory_feedback(useful: true)`.
  One per event, specific, and `memory_relate` it to the fragment it concerns.
- Also record when the user pushes back on a wrong claim — those corrections are
  the highest-value fragments.

## OpenCode v2 traps (high-frequency; RUNBOOK.md for the rest)

- `Model.Info` has **two** ids: `id` (the registry key that `/models` lists and
  `-m` takes) and `modelID` (what is actually sent upstream). Cloning a model
  across providers must override both, or it looks fine in the picker and 404s on
  every call. `Model.Ref` in session hooks has `id`, not `modelID`.
- Code Mode `execute()` must return `{content}` — a bare string throws
  `"output" in s`. The `out()` wrapper belongs only inside `execute`, never in a
  helper that returns a string.
- Commenting a plugin out of the `plugins` array does **not** disable it: v2
  auto-discovers `plugin/` and `plugins/`. `gio trash` the dir, then
  `opencode service restart`.
- `opencode plugin list` and `opencode debug config` report the **running daemon**,
  not disk — a stale daemon makes a correct edit look ineffective.
- Never enable a plugin in the live config that mutates a live request path (auth
  headers, model ids, bodies) in order to debug it — that broke opencode globally
  on 2026-09-27. Instrument the EXISTING plugin's own code path with inert,
  append-only, try/catch logging instead.

## Infra pointers

- Vault: `/home/shared/Zurnel` (Obsidian). Its own rules live in
  `Zurnel/AGENTS.md` — read the section index before placing anything. The
  `obsidian-rest` MCP is only live while Obsidian is open; if vault tools are
  missing, check `pgrep obsidian` before assuming the config is broken.
- Web: native `websearch` (Tinyfish default, no API key needed) + native `webfetch`.
- Browser: the native `browser` tool is the only browser here — the `playwright`
  MCP is disabled in `opencode.jsonc`. It needs a connected browser and is not
  signed in to anything, so authenticated work needs the user to log in, or
  `gh auth login` / a PAT.
- Hyprland config is **Lua** (`config/hypr/**/*.lua`): legacy `hyprctl dispatch`
  and `hyprctl keyword` are dead in 0.56. Before touching window rules read the
  header notes in `configs/WindowRules.lua` — two silent failure modes there cost
  a whole session to find.
- Ops runbook: `~/.config/opencode/RUNBOOK.md`.
