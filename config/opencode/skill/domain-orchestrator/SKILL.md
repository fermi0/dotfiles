---
name: domain-orchestrator
description: Route any user request to the right domain skill and chain cross-domain workflows. Use when a task spans multiple domains (e.g. research → report → vault note → daily plan), when you are unsure which skill applies, or when connecting computer/browser/dev/business/daily/note-taking work into one coherent flow. Acts as the planning/routing layer over all other skills.
created: 2026-08-30
status: draft
sources:
  - "https://zylos.ai/research/2026-01-16-long-running-ai-agents/"  # Long-running agents, task decomposition, Deep Agents architecture
  - "https://medium.com/@justinroy0089/ai-agent-orchestration-beyond-single-chatbots-2026-guide-8c00e8cf06fe"  # 2026 orchestration guide
  - "https://www.anthropic.com/engineering/building-effective-agents"  # agent patterns
tags:
  - skill
  - orchestration
  - meta
  - routing
---

# Domain Orchestrator (the connector, 2026)

The **planning + routing layer** over all your domain skills. Decides fast, hands off to the right skill, chains domains into coherent flows, and manages cost/state/failure across multi-step work. **Load this on ambiguous or cross-domain requests.**

> **Golden rule (2026):** if the task is clearly one domain, load only that skill and get to work — the orchestrator adds ~no work on single-domain tasks. If it spans 2+ domains, **this skill earns its keep**.

> **The 35-minute rule:** agent performance degrades measurably after ~35 min of human-equivalent work. For long chains, **checkpoint state to the vault** between steps so a fresh agent can resume. Don't try to hold 2 hours of work in one context.

## How to use this skill

1. **Quick routing** → [§ Routing table](#routing-table) + [§ Decision logic](#decision-logic)
2. **Chain skills** → [§ Chain recipes](#chain-recipes) + [§ The 7 loops](#the-7-loops)
3. **Plan a multi-step task** → [§ Planning a chain](#planning-a-chain)
4. **Manage cost / model tiering** → [§ Cost & model tiering](#cost--model-tiering)
5. **Pass state between steps** → [§ State passing](#state-passing)
6. **Recover from failure** → [§ Failure recovery across the chain](#failure-recovery-across-the-chain)
7. **Run a sub-agent** → [§ Sub-agents & parallel chains](#sub-agents--parallel-chains)
8. **Cross-chain memory** → [§ Cross-chain memory](#cross-chain-memory)
9. **No skill fits** → [§ When no skill fits](#when-no-skill-fits)
10. **Full playbook** → [§ Workflow playbook](#workflow-playbook)

## Skills in scope (your current library)

| Skill | Domain | When |
|---|---|---|
| `deep-research` | Research (multi-source, citation, synthesis) | Non-trivial research, source quality, citations |
| `business-planning` | Business (Nepal-focused; universal frameworks) | Market research, plans, pricing, decisions, Nepal business |
| `development-workflows` | Engineering (build, deploy, test) | New feature, refactor, deployment, MCP dev |
| `browser-control` | Browser (Playwright MCP + @playwright/test) | Any web page interaction, scraping, E2E tests |
| `notetaking-brain` | Vault (Obsidian, notes, links) | Save/find/organize anything in the vault |
| `daily-planning` | Productivity (habits, MITs, plans) | Daily plan, motivation, habit tracking |
| `linux-poweruser` | Linux systems | Package management, services, debugging, sysadmin |
| `domain-orchestrator` | **THIS** (routing) | Cross-domain, ambiguous, or chain tasks |
| `lemma` | Memory | Persist insights across sessions |
| `find-skills` | Skill discovery | Find new skills for a need |

> **Always check current skills** with `ls ~/.config/opencode/skill/` + `ls ~/.agents/skills/` before routing — the library evolves.

## Routing table (task → skill)

| Task smells like… | Load skill |
|---|---|
| Research a topic, source + cite claims, deep read | `deep-research` |
| Market research, business plan, pricing, Nepal business, dashboard, decision | `business-planning` |
| Build/refactor/plan architecture/stack/backend/frontend/MCP/deploy | `development-workflows` |
| Navigate/search/click/type/scrape a website; E2E test | `browser-control` |
| Save to vault, find in vault, organize vault, link notes | `notetaking-brain` |
| Daily plan, to-do, motivation, habit tracking | `daily-planning` |
| Install/fix a system, manage a service, debug a command, pacman/yay | `linux-poweruser` |
| Persist insight for future sessions | `lemma` |
| Find a new skill for a need | `find-skills` |
| **Cross-domain, ambiguous, or chain** | **`domain-orchestrator` (this skill)** |

## Decision logic (how to choose)

**Don't just match keywords.** Use this 30-second decision tree:

```
Q1: Is the task clearly one domain?
    YES → Load that skill, get to work
    NO  → Continue to Q2

Q2: Does the task span 2+ domains in a clear sequence?
    YES → Identify the chain, load THIS skill + plan the chain
    NO  → Continue to Q3

Q3: Am I uncertain which skill fits?
    YES → Load THIS skill + use the routing table + (optionally) ask the user
    NO  → Use the routing table

Q4: Is this a known recurring pattern (daily plan, research, build)?
    YES → Load the matching skill
    NO  → Load THIS skill + decompose
```

**Tie-breaking (when 2 skills look equally good):**
1. **The skill whose triggers match** the user's wording
2. **The skill with the most output relevance** to the user's goal
3. **The cheaper skill** (less context, less tool surface)
4. **If still tied:** state the choice + the alternative in one line; don't ask the user unless truly blocked

**When to ask the user:**
- A constraint only they know (credentials, preferences, destination)
- A design decision with high irreversibility
- A 3rd retry on a stuck state

**When NOT to ask:**
- A clear technical decision (the orchestrator decides)
- A choice between 2 reasonable options (pick one, move on)
- A "do you want me to..." confirmation (just do it; they can interrupt)

## Chain recipes

### The 7 loops (cross-domain chain templates)

These are battle-tested chains. **Pick the closest fit; customize as needed.**

#### 1. **The Golden Loop — Research → Business → Notes → Plan**

The most common. Used whenever you need to **decide something** based on **evidence**.

```
1. deep-research    → gather + cite; produce findings
2. business-planning → analyze (TAM, competitors, pricing); produce report
3. notetaking-brain  → save report + findings as linked notes; update MOC; log changelog
4. daily-planning    → turn outcome into tomorrow's MIT
```

**Use when:** evaluating a new business, choosing a tech stack, deciding a market to enter, picking a vendor.

#### 2. **Dev Feature Loop — Plan → Build → Test → Document**

The standard for shipping software.

```
1. development-workflows → spec + plan + scaffold
2. development-workflows → implement (TDD where it pays)
3. browser-control       → E2E test the critical path
4. notetaking-brain      → ADR + CHANGELOG entry
5. (optional) development-workflows → deploy
```

**Use when:** any new feature or bug fix that touches ≥2 files.

#### 3. **News Intelligence Loop — Monitor → Capture → Triage → Act**

The business-planning daily news workflow.

```
1. (scheduled) deep-research → daily Nepal news scan (15 min)
2. business-planning         → save raw HTML to ~/Downloads/BusinessPlanning/news-intel/
3. business-planning         → write a daily intel brief in vault
4. (if opportunity) business-planning → run the 8-phase playbook
```

**Use when:** "what's happening in Nepal?" or any policy/regulation monitoring.

#### 4. **System Issue Loop — Diagnose → Fix → Document**

The Linux / sysadmin chain.

```
1. linux-poweruser      → diagnose (logs, processes, services)
2. linux-poweruser      → fix (package, config, restart)
3. notetaking-brain     → save "fix notes" (do-not-rebreak)
4. (optional) daily-planning → add maintenance task to habit tracker
5. (optional) lemma     → memory_add the root cause
```

**Use when:** something is broken or behaving unexpectedly.

#### 5. **Research Output Loop — Explore → Synthesize → Vault → Cite**

For deep research that should become permanent knowledge.

```
1. deep-research      → multi-pass discovery + read
2. deep-research      → synthesize with citations
3. notetaking-brain   → write permanent note + link to MOC
4. lemma              → memory_add the key takeaway
5. business-planning  → if it informs a decision, add to the relevant report
```

**Use when:** learning something you want to remember and reuse.

#### 6. **Build-from-Scratch Loop — Idea → Spec → Plan → MVP**

For a new project from zero.

```
1. business-planning     → validate the idea (hypothesis-driven)
2. business-planning     → BRD / spec
3. development-workflows → architecture + stack decision
4. development-workflows → Tier 1 scaffold (Vite + Hono + SQLite)
5. development-workflows → MVP features (TDD)
6. browser-control       → E2E test
7. notetaking-brain      → ADR per significant decision; CHANGELOG
8. business-planning     → GTM + pricing (post-build)
```

**Use when:** "I want to build X" where X is real and worth the effort.

#### 7. **Daily Loop — Recall → Plan → Execute → Reflect**

The end-of-day / start-of-day chain.

```
1. lemma            → memory_read (recall what matters for today)
2. notetaking-brain → read today's daily note
3. daily-planning   → set MITs + schedule
4. (during the day)  → execute; append progress to daily
5. daily-planning   → evening reflection
6. lemma            → memory_add key insights
```

**Use when:** starting a workday, ending a workday, or setting up a new week.

## Planning a chain

**Before you start a multi-step chain, plan it.** Don't improvise across 5 skills.

### The chain plan (1 screen)

```markdown
## Chain: {goal}

**Outcome:** {what success looks like, in 1 sentence}

**Steps:**
1. {skill} → {deliverable}
2. {skill} → {deliverable}
3. {skill} → {deliverable}

**State to pass between steps:**
- After step 1: {what step 2 needs from step 1}
- After step 2: {what step 3 needs from step 2}

**Estimated cost:** {tokens, time, tools}
**Estimated wall clock:** {minutes}

**Failure modes:**
- Step {N} fails → {fallback}
- Step {N} returns ambiguous → {fallback}

**Checkpoint policy:** save state to vault after step {N}
**35-min rule:** restart agent at step {N} if I exceed 35 min
```

### When to plan vs. just start

| Condition | Plan? |
|---|---|
| 1 skill, 1 deliverable | No — start |
| 2 skills, clear sequence | Brief inline plan |
| 3+ skills or any uncertainty | Plan first |
| 1 hour+ expected duration | Plan + checkpoint |
| High cost (paid APIs, destructive ops) | Plan + checkpoint |
| Reversible, cheap, low-stakes | Just start |

## Cost & model tiering

> **Verified 2026 finding (Zylos):** Planner-Worker architecture can give **90% cost reduction** by using capable models for planning and cheaper models for execution. The orchestrator is the planner.

### When to use which tier

| Step type | Model tier | Why |
|---|---|---|
| Routing decision (which skill?) | Cheap (Haiku, local) | Trivial; doesn't need depth |
| Planning a chain | **Capable (Sonnet, GPT-5)** | Needs to think about structure, dependencies, cost |
| Research synthesis | **Capable** | Quality of synthesis matters |
| Writing reports | **Capable** | Quality of writing matters |
| Routine execution (fill form, save note) | Cheap | Mechanical |
| Verification / review | Cheap | Mechanical |
| Code generation | **Capable or specialized** | Quality matters |
| Browser automation decisions | **Capable** | Snapshot interpretation needs reasoning |
| Translation between skills | **Capable** | State loss is costly |

### Cost-control discipline

- **Don't re-plan** the same chain 3 times; commit to the first plan that passes the sniff test
- **Don't load all skills** at once; load only the current step's skill
- **Don't fetch** pages you won't read
- **Do checkpoint** long chains to the vault to avoid context bloat
- **Do summarize** at each step (don't pass raw output to the next step)

## State passing

**State flows between skills as data + decisions + pointers.** Don't pass everything; pass what's needed.

### State patterns

| Pattern | When | Example |
|---|---|---|
| **File path** (most common) | The next step can re-read | `→ business-planning: read ~/shared/Zurnel/Research/X/findings.md` |
| **Inline summary** | The next step needs the result immediately | "Top 3 competitors are: A, B, C" |
| **Decision / choice** | The previous step decided | "We chose Cloudflare over Vercel" |
| **Handoff note** | A complex state that's hard to summarize | A 5-bullet handoff doc |
| **ID + lookup** | The state is in a known place | "The repo is github.com/foo/bar; the issue is #42" |

### State-passing discipline

- **Write the state to disk** (vault, file, or DB) — never pass in transient context only
- **Use a consistent handoff format** — `deliverable: <path> + summary: <3-5 bullets> + decision: <if any>`
- **Test the handoff** — can the next step act on it without asking questions?

### State handoff template (1 file, 1 screen)

```markdown
# Handoff: {from step} → {to step}

**Date:** YYYY-MM-DD
**From:** {skill or agent}
**To:** {skill or agent}

## What was done
{2-3 sentences; the work just completed}

## Deliverable
{path or ID of the artifact}

## Key findings / decisions
- {bullet 1}
- {bullet 2}
- {bullet 3}

## What's next
{1 sentence; what the next step should do}

## Open questions
- {anything that needs the user's input}
```

## Failure recovery across the chain

### Chain failure modes

| Failure | Symptom | Recovery |
|---|---|---|
| **Skill doesn't load** | Tool/skill not found | Check skill exists; fall back to direct tool use; ask user |
| **Skill returns no result** | Empty output | Check inputs; try alternate skill; ask user |
| **Skill returns wrong result** | Output doesn't match expected shape | Re-prompt with clarification; try alternate skill; accept partial |
| **Chain too long** | Exceeds 35-min context budget | Checkpoint now; restart from checkpoint |
| **Cost blowout** | Token count ballooning | Compress state; reduce scope; defer to a paid sub-agent |
| **Circular dependency** | Step 3 needs Step 1, which needs Step 3 | Re-plan; insert a state-passing step |
| **External service down** | API/website unreachable | Retry; alternate source; ask user |

### The 3-retry rule

If the same step fails 3 times:
1. **Stop and re-plan** the step (don't keep retrying)
2. **Escalate to the user** if re-planning doesn't help
3. **Mark the chain as partial** and continue with what you have

### Rollback

If a step succeeds but you discover later it was wrong (e.g., wrong URL scraped):
- **Don't re-run from scratch** — re-run just that step
- **Mark the chain in vault** with a "rollback" entry so future-you knows
- **Add the gotcha to lemma** so you don't repeat the mistake

## Sub-agents & parallel chains

> **Load `development-workflows` for the multi-agent development section** if your chain is implementing code. This section covers sub-agents in general.

### When to fan out (parallel sub-agents)

- **Independent research streams** — 3 sources, no dependencies
- **Read-only reviews** — security, test gaps, API mapping
- **Brainstorm alternatives** — 3 different angles on the same problem
- **Multi-page scraping** — 10 product pages from 10 different sites

### When NOT to fan out

- **Sequential dependencies** — step 2 needs step 1's output
- **Single trivial task** — coordination overhead > work
- **Destructive operations** — never parallel (race conditions)
- **State-mutating operations** — serial only

### Sub-agent discipline

- **Define the contract** before dispatch (what's the input, what's the output, what's the format)
- **Isolate work** — give each sub-agent a git worktree, a separate folder, or a clear scope
- **Cap fix loops at ~3 iterations** — then escalate to the planner (this orchestrator)
- **Synthesize** sub-agent outputs into one coherent answer; don't paste-and-pray

## Cross-chain memory

> **What persists across chains?** Without a discipline, every chain is a fresh start. With one, you build compounding knowledge.

### What to persist (and where)

| What | Where | When |
|---|---|---|
| Insights / patterns | `lemma` (memory_add) | End of any chain that taught you something |
| Procedures / SOPs | `notetaking-brain` (SOP note) | When a chain becomes repeatable |
| Project artifacts | `notetaking-brain` (project folder) | Per project |
| Source list | `notetaking-brain` (source list) | Per research project |
| Mistakes / gotchas | `lemma` (session_attempt) | When a chain fails or you realize a wrong path |
| Time / cost / outcome | `notetaking-brain` (CHANGELOG or daily) | End of significant chains |
| New skill ideas | `notetaking-brain` (skill proposal note) | When a chain reveals a reusable pattern |

### Cross-chain memory pattern

```
End of chain:
1. lemma.memory_add(key insight or pattern)
2. lemma.session_attempt(failed approaches; what didn't work)
3. notetaking-brain.append(daily note: "chained X → Y → Z; output at <path>")
4. notetaking-brain.add changelog entry if vault changed
```

### The compounding effect

After 6 months of disciplined cross-chain memory:
- 90% of common tasks are SOPs you can follow
- Mistakes are remembered (don't repeat)
- Skills evolve based on real use
- The vault becomes a true second brain

## When no skill fits

### Diagnose

- Does the request map to a domain? (research, dev, business, browser, vault, daily, linux)
- If yes but the existing skill is too narrow → expand the skill, don't work around it
- If no → it's either a new domain or a meta-task

### Options

1. **Work without a skill** — use raw tools (search, fetch, file ops) for a one-off
2. **Compose multiple skills** — chain existing skills (this is what the orchestrator does)
3. **Extend an existing skill** — add a new section for the use case
4. **Propose a new skill** — write a SKILL.md, install it, use it
5. **Ask the user** — they may have a preference

### Anti-patterns

- ❌ Invent a workflow on the fly without a skill or plan
- ❌ Skip the orchestrator and improvise a 5-skill chain
- ❌ Create a new skill for a one-off task
- ❌ Work around an existing skill instead of improving it

## When to fall back / ask the user

### Ask the user when

- **2 routing options look equally strong** AND the choice is high-stakes — pick one, state the alternative, but ask if uncertain about user preference
- **A task needs info you don't have** — credentials, preferences, destination, contact
- **A destructive operation** with unclear consent (delete, post, send money)
- **A sub-phase balloons** — log progress, mark in vault, ask the user
- **3 retries on the same step** — re-plan, then ask

### Don't ask when

- The choice is recoverable (just pick one)
- The user already gave guidance (execute it)
- A clear technical default exists (state it, move on)
- You're asking "do you want me to..." (just do it)

## Consistency rules (the loop)

> **The loop is the value.** Each chain produces something worth persisting; each persistence makes the next chain faster.

1. **Recall first** — start every chain by reading HANDOFF + lemma memory + the relevant MOC. Don't re-derive known state.
2. **Plan with checkpoints** — for any chain >3 steps, write the plan with state-passing defined.
3. **Execute one step at a time** — load only the current skill; don't pollute context.
4. **Verify at each step** — never continue on a failure you haven't understood.
5. **Persist at the end** — vault note + lemma insight + daily reflection.
6. **Propose a skill** when a chain reveals a reusable pattern.
7. **Iterate on the skill** — if the chain worked, the skill should make it easier next time.

## When a chain yields a new reusable step

**A chain that works twice is a candidate for a skill or a slash command.** Examples:

- "Daily news scan" → a `news-scan` slash command or a `schedule_job`
- "Spec → ADR" → a `make-adr` slash command
- "URL → scraped Markdown → vault note" → a skill
- "Vault health check" → a `vault-health` slash command

**Propose these in the daily reflection.** Don't bloat the skill library; do promote proven patterns.

## Guardrails / anti-patterns

- ❌ Load all skills at once (token waste) — load only the current step's skill
- ❌ Fire research without a stated purpose/question
- ❌ Chain without a plan (3+ skills)
- ❌ Skip the checkpoint (lose state on 35-min degradation)
- ❌ Pass raw output to the next step (always summarize)
- ❌ Re-plan the same chain 3 times
- ❌ Hide failures from the user
- ❌ Pretend a chain worked when it didn't
- ❌ Skip the persistence step (lose the value)
- ❌ Add a skill to the library without using it 3+ times

## Workflow playbook (real scenarios)

### Scenario 1: "Should I start a side hustle in Nepal doing X?"

```
1. domain-orchestrator (this skill) → plan the chain
2. deep-research → market research on X (Nepal context)
3. business-planning → TAM/SAM/SOM + competitor scan + pricing
4. business-planning → hypothesis-driven validation plan
5. notetaking-brain → save the report + MOC update
6. daily-planning → if yes, set 1 MIT for the week
```

### Scenario 2: "Build me a new feature in my project"

```
1. development-workflows → spec + plan
2. development-workflows → implement (TDD)
3. browser-control → E2E test the critical path
4. notetaking-brain → ADR + CHANGELOG
5. development-workflows → deploy (if ready)
6. lemma → memory_add the architectural decision
```

### Scenario 3: "The server is down"

```
1. linux-poweruser → diagnose
2. linux-poweruser → fix
3. notetaking-brain → save "fix notes" (do-not-rebreak)
4. lemma → memory_add the root cause
5. (optional) daily-planning → add monitoring habit
```

### Scenario 4: "What's happening in Nepal's fintech?"

```
1. business-planning → news intelligence workflow
2. business-planning → save raw HTML, write daily intel brief
3. deep-research → if a deep dive is warranted
4. notetaking-brain → MOC update + permanent note for key insight
5. (if opportunity) business-planning → run the 8-phase playbook
```

### Scenario 5: "I'm starting my day"

```
1. lemma → memory_read (recall)
2. notetaking-brain → read today's daily note
3. daily-planning → set MITs
4. (execute) → the first MIT
5. (end of day) daily-planning → reflection
```

### Scenario 6: "I want to learn Y deeply"

```
1. deep-research → multi-pass research on Y
2. notetaking-brain → permanent note + MOC
3. (optional) development-workflows → build a small project
4. lemma → memory_add the core insight
5. daily-planning → schedule spaced repetition review
```

## Tools in our stack

- **All domain skills** (deep-research, business-planning, development-workflows, browser-control, notetaking-brain, daily-planning, linux-poweruser, lemma, find-skills)
- **`with-context` MCP** — for vault operations between steps
- **`opencode scheduler`** — for scheduled chains (daily news scan, weekly vault health, monthly report)
- **OpenSpec** — for new ventures or major changes (formal change proposal)
- **Handoff plugin** — for session continuation when a chain spans sessions
- **Lemma** — for cross-session memory

## Related skills

- All other skills. This skill's job is to connect them.
