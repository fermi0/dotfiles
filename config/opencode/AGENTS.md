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
- **Web**: searxng MCP (localhost:8080). **Browser**: playwright MCP.
- **Large files/output**: use `read_smart` or Code Mode `execute`; never dump >200KB into context; wrap long lines ≤120 chars; never truncate bash output.
- **Ops runbook** (plugin stack, post-`pacman -Syu` checks, diagnostics, backups): `~/.config/opencode/RUNBOOK.md`.

## Safety

- Backup before modifying config. Never commit `.env` or `*poorguy-ratelimit.jsonc*`.
- Delete via `gio trash` only; NEVER `rm`; NEVER empty Trash.
