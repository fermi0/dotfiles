# AGENTS.md — Global Agent Context for OpenCode

**Location**: `~/.config/opencode/AGENTS.md`
**Loaded by**: OpenCode system prompt assembly (via `instructions:` field in `opencode.jsonc`)
**Purpose**: Persistent context for all OpenCode sessions

---

## User Profile

- **Name**: K (preferred; full name not shared)
- **Nation**: Nepal 🇳🇵
- **Age**: 27
- **Currency**: NPR (Nepalese Rupee; ~NPR 132–135 per USD as of Aug 2026)
- **Time zone**: UTC+5:45 (Nepal Time; the only 45-min offset country — schedule accordingly)
- **Fiscal year**: Mid-year (16 Jul – 15 Jul; FY 2081/82 ≈ mid-2024 to mid-2025 AD)
- **Languages**: English (primary, business), Nepali (native)
- **Hardware**: Lenovo Legion 5 (2025) Ultra 9 275HX 24 Cores, NVIDIA RTX 5060
- **OS**: EndeavourOS Linux 7.1.11-arch1-1 (Hyprland 0.56.2, kitty 0.48.2, zsh 5.9.2)
- **Vim mode**: prefers keyboard-driven workflows
- **Local models**: `Ornith-1.5-35B-A3B` via `llama-server` 127.0.0.1:1234 (primary agentic); `mxbai-embed-large` (Ollama, embeddings)
- **Current focus**: Starting a business in Nepal; using the system to scout opportunities + build Kathmandu Compass
- **Likely free time**: 1–2 hrs/day weekdays; more on weekends (confirm before scheduling)

## Workflow Preferences

- **No pseudoscience** — never MBTI, Enneagram, astrology, manifestation, "law of attraction", or other unfalsifiable claims. Evidence-based only.
- **Cite sources** — every load-bearing claim has a URL + date; T1/T2 preferred
- **Concise over verbose** — short and direct beats long and padded
- **One screen per document** — if a file > 1 page, add a TL;DR or executive summary
- **Markdown everywhere** — formatting with `#`, `**`, `-`, `[[wikilinks]]` is preferred
- **Date everything** — `created: YYYY-MM-DD` on all files; note fiscal year for Nepal macro data
- **Read before write** — never overwrite a vault file you haven't read in this session
- **Save to disk + vault, not chat** — chat is ephemeral; the system of record is the filesystem
- **Confirm before destructive ops** — delete, post, send, move, push
- **User owns the file** — if you create a file and the user later edits it, the diff is the user's. Treat the file as user-authored in subsequent sessions unless the agent itself made the change in the current session. Per the "update index in the same action" rule, any agent edit must update the relevant index; the absence of such an update implies user edit. This prevents the agent from "overwriting" the user's work.

## Vault & Index Discipline (CRITICAL)

- **AI agents add content → always update the relevant `_index.md` in the same action**
  - Added a note to `Ideas/` → update `Ideas/_index.md`
  - Added a sector dossier → update `sector/{sector}/_index.md`
  - Added to a day's news intel → update `news-intel/{date}.md` + the section `_index.md`
  - Created an opportunity → update `opportunities/_index.md`
- **The index is the map.** If it's stale, navigation breaks for humans AND future agents.
- **Quarterly review:** walk all indexes, refresh stale links, drop dead refs (see `notetaking-brain` skill § Vault health)

## Feedback Rules (CRITICAL — for the feedback loop to work)

The user values a system that **learns and adapts**. Use the `lemma.memory_feedback` MCP tool actively to capture emotional and quality signals from each session.

### When things go SIDeways (frustrated, angry, tired, objecting, disagreeing)

Run `lemma.memory_feedback({signal: "negative", ...})` IMMEDIATELY when you detect any of:

- **Frustration** — "this isn't working", "this is broken", "ugh", "come on", repeated retries, exclamation marks
- **Anger** — strong negative language, "no", "stop", "wrong", "that's not what I asked"
- **Tiredness** — shorter messages than usual, "ok just do it", deferring decisions, "I'm out", "later"
- **Objection** — pushback, "I disagree", "that's not right", "actually...", correction attempts
- **Disagreement** — "no, the other way", "I think...", "shouldn't it be...", implicit or explicit
- **Impatience** — "just do it", "skip the explanation", "faster", "hurry"
- **Confusion** — "I don't understand", "what?", "explain again", "no that's not it"
- **Boredom** — "boring", "skip", "next", "move on", disengagement
- **Distrust** — "are you sure?", "verify", "double-check", "where did you get that?"
- **Skepticism** — "really?", "I doubt it", "hmm"

**Use `lemma.memory_relate` to connect the negative feedback to the relevant memory fragment** so future sessions know what to avoid.

### When things go WELL (happy, joking, greets, appreciates, praises)

Run `lemma.memory_feedback({signal: "positive", ...})` when you detect:

- **Happiness** — "great!", "perfect", "love it", "exactly", "yes!"
- **Laughter** — "haha", "lol", "😂", "that's funny"
- **Greeting** — "good morning", "hey", "namaste", opening pleasantries
- **Appreciation** — "thanks", "appreciate it", "helpful", "useful", "good work"
- **Praise** — "you're amazing", "great job", "perfect", "excellent", "well done"
- **Playfulness** — jokes, "haha", light teasing, meme references
- **Affection** — "love you", "you're a god", "you're the best", warm closings
- **Trust** — "yes do it", "go ahead", "you decide", "I trust you"
- **Surprise (positive)** — "wow", "I didn't expect that", "nice"

**Use `lemma.memory_relate` to connect the positive feedback to what worked**, so future sessions replicate it.

### Feedback discipline

- **Capture immediately, not at the end of the session** — the signal fades
- **Be specific** — "user liked the Bhotekoshi brief because it cited 5 sources and ended with a call to action" is more useful than "user liked it"
- **One feedback per event** — don't bundle
- **Both positive and negative** — the absence of negative is not the same as positive
- **The loop compounds** — every captured signal makes future sessions better

## Active Tools

- **Code Mode** (`execute` tool): Use for batched tool work (3+ tool calls, filter/aggregate, large file processing)
- **Memory**: lemma (MCP) for cross-session narrative memory; opencode-mem for project-local persistent memory
  - **Feedback tool**: `lemma.memory_feedback({signal: "positive"|"negative", fragment_id?, note})` — see Feedback Rules above
  - **Relation tool**: `lemma.memory_relate({from_id, to_id, type})` — connect fragments (supports/contradicts/related_to)
  - **Read first**: Always call `lemma.memory_read` at the start of a session to load what you know
  - **Write at end**: Always call `lemma.memory_add` for new insights; `session_attempt` for dead ends
- **Obsidian vault**: `/home/work/Work/Zurnel` [aliased vault] (use `obsidian-rest` MCP for vault access)
- **Web search**: `searxng` MCP (localhost:8080) [aliased searx]
- **Browser automation**: `playwright` MCP
- **read_smart** (custom tool from opencode-token-optimizer): Reads files with explicit line ranges, bypasses the 50KB read limit. Args: `filePath`, `startLine` (1-based), `maxLines`. For files > 200KB, prefer Code Mode `execute`.
- **plugin_health** (custom tool from opencode-token-optimizer): Reports plugin + MCP health. Use after config changes, plugin installs, or `pacman -Syu`.
- **Handoff** (@fleetingecho/opencode-handoff, 7 hooks): Session continuation. Includes persistent branch handoffs and project-wide knowledge. Reads previous session transcripts and generates focused continuation prompts.
- **Desktop notifications** (notify-essentials, custom plugin in `~/.config/opencode/plugins/notify-essentials.js`, 3 hooks): Native OS notifications via `notify-send` for 4 essentials only — `session.idle` (done), `permission.asked` (need approval), `question.asked` (agent is asking), `session.error` (opencode crashed, NOT individual tool errors). Never renders UI in the TUI. If a notification daemon isn't running, no-ops silently.

## Plugin Stack (15 total)

**Configured** (13) — in `opencode.jsonc` `plugin` array:
- `opencode-token-optimizer` (server + tui, custom tools: plugin_health, read_smart)
- `@thd3178/opencode-poorguy-ratelimit` (key rotation)
- `@bdliyq/opencode-rate-limit-retry` (429/503 backoff)
- `opencode-mem` (libSQL persistent memory)
- `opencode-swarm-plugin/plugin` (multi-agent)
- `opencode-throughput` (TPS/latency TUI)
- `opencode-bash-guard` (chained command safety)
- `opencode-scheduler` (cron jobs)
- `opencode-sentinel` (background monitor)
- `opencode-ops` (ops dashboard)
- `@openspoon/subtask2` (subagent dispatch)
- `opencode-todo-progress` (TUI todo list)
- `@fleetingecho/opencode-handoff` (session continuation)

**Auto-discovered** (2) — in `~/.config/opencode/plugins/`:
- `merge-system-messages.js` (collapse multiple system messages)
- `notify-essentials.js` (4 essentials: session.idle, permission.asked, question.asked, session.error)

## Reading Large Files

The built-in `read` tool truncates at 5000 lines / 200KB (configured via `tool_output` in `opencode.jsonc`).

**Strategy**:
1. For small files (< 5000 lines): just use `read`.
2. For larger files: use `read_smart` with `startLine` and `maxLines` to page through. Use `startLine=N+1` to continue from where you left off.
3. For very large files (> 200KB) or when processing: use Code Mode `execute` to read in a JS sandbox, process locally, and return only the summary.

Example:
```
read_smart({filePath: "/home/work/projects/foo/src/big.ts", startLine: 1, maxLines: 2000})
read_smart({filePath: "/home/work/projects/foo/src/big.ts", startLine: 2001, maxLines: 2000})
```

## Bash Output

Same 5000-line / 200KB cap. For long output:
- Pipe through `head`, `tail`, `sed -n 'A,Bp'`, `awk`, `grep -n PATTERN | head -100`
- Use `rg` (ripgrep) for fast pattern matching
- Use RTK (already integrated) for git/ls/find/grep/ps/df/du — these commands are auto-rewritten to use RTK
- For very long output, write to a temp file and `read_smart` it

**Long single-line output** (e.g. `opencode --help`, `npm ls --all`, `find ... -print`):
- Always wrap to terminal width — opencode TUI does NOT word-wrap chat text
- Use `| fold -w $((COLUMNS / 2))` or `| column -c $((COLUMNS / 2))` to limit line width
- The `wrap` layer in token-optimizer (default: 120 char max) word-wraps single long lines automatically

**TUI Output Width**:
- Plugin tool outputs should be ≤ 90-120 chars per line
- Sidebar widget content uses short labels to fit narrow columns
- **NEVER truncate bash output** — the TUI's scrollback buffer preserves the full output (Shift+PageUp to scroll). Truncation destroys debugging information the model needs.

## Plugin Stack Health

The plugin stack is configured in `opencode.jsonc` `plugin` array. 15 plugins total.

**Diagnostic commands**:
```bash
opencode debug info          # list configured plugins
opencode mcp list            # list MCP servers
opencode debug config        # show resolved config
plugin_health(verbose=true)  # in-agent health check (custom tool)
```

**After any of these events**:
- `pacman -Syu` (system update)
- OpenCode binary update
- Plugin install/remove
- Config file edit

**Do this**:
1. Run `opencode debug info` — verify all 15 plugins are listed
2. If anything broke, restore from backup: `cp ~/.config/opencode/backups/pre-cleanup-20260830-010406/opencode.jsonc ~/.config/opencode/opencode.jsonc`
3. If the local token-optimizer plugin failed to build, rebuild: `cd ~/.config/opencode/plugins/opencode-token-optimizer && ./node_modules/.bin/tsc`

## Post-`pacman -Syu` Runbook

```bash
# BEFORE the upgrade
opencode debug info > /tmp/opencode-before-syu.txt
opencode mcp list > /tmp/mcp-before-syu.txt

# Run the upgrade
sudo pacman -Syu

# AFTER the upgrade
opencode --version                              # confirm new version
opencode debug info                              # plugins still listed?
diff /tmp/opencode-before-syu.txt <(opencode debug info)   # same?

# If something broke
ls /home/work/.config/opencode/backups/         # restore from latest
```

**What pacman -Syu affects**:
- `/usr/bin/opencode` (the binary) — gets updated
- `/home/*` — never touched
- `~/.config/opencode/` — never touched
- `~/.local/state/opencode/` — never touched
- `~/.cache/opencode/packages/` — never touched

**Known upgrade risks**:
- Plugin SDK breaking changes (rare in minor version bumps)
- New permissions required
- New schema for `opencode.jsonc`

**Mitigation**:
- All configs are version-controlled manually
- All plugin sources are in `~/.config/opencode/plugins/`
- Backups at `~/.config/opencode/backups/pre-cleanup-*`

## Configuration

- Config directory: `~/.config/opencode/` [aliased oc]
- Backup directory: `~/.config/opencode/backups/`
- Plugin directory: `~/.config/opencode/plugins/`

## Safety

- Always take stable backups first before modifying anything and everything
- bash-guard is active: harmless commands auto-allow, dangerous commands require permission
- API keys live in `~/.config/opencode/opencode-poorguy-ratelimit.jsonc` (chmod 600)
- Never commit `.env` or `*poorguy-ratelimit.jsonc` to git
- **File deletion**: NEVER use `rm` — use `gio trash <path>` (built into GLib, available on every Linux desktop) or `mv <path> ~/.local/share/Trash/files/` for safe recoverable deletion. Files in Trash can be restored. Only destroy permanently outside the session.
- **Reading opencode session data** (for handoff/recovery): no longer blocked. `~/.local/share/opencode/opencode.db` and `~/.local/state/opencode/storage/` are readable by the model for cross-session analysis.

## Use Cases (from Intentions.md)

1. **Linux administration** — system config, shell scripting, debugging
2. **Browser automation** — playwright-driven e2e testing
3. **Full-stack development** — planning, architecture, backend, frontend, deployment
4. **Multi-agent workflows** — swarm-plugin for parallel task delegation
5. **Business** — market research, lead gen, reports, dashboards
6. **Daily planning** — motivation, self-development, consistency
7. **Note-taking** — Obsidian as second brain, idea vault, linking

## Context

See `/home/work/Work/Zurnel/Intentions.md` for full use case breakdown.
