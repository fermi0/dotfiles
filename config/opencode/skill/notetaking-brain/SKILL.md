---
name: notetaking-brain
description: Turn the Obsidian vault into the central brain. Use when note taking, Obsidian integration or organization, vault (re-)organization or cleanup or rearrangement, linking notes or tags, idea vault, creative pursuit, changelog, daily notes, second brain, knowledge management, MOC/index building, Obsidian Bases, Dataview, Templater, Canvas, AI-powered vault workflows, or connecting notes across the other domains.
created: 2026-08-30
status: draft
sources:
  - "https://obsidian.md/"  # official site (1.5M+ users, Aug 2026)
  - "https://raw.githubusercontent.com/kepano/obsidian-skills/main/skills/obsidian-markdown/SKILL.md"  # OFM reference from Obsidian creator
  - "https://help.obsidian.md/"  # official docs
  - "https://www.nxcode.io/resources/news/obsidian-ai-second-brain-complete-guide-2026"  # AI second brain 2026
  - "https://www.natecue.com/en/learn/productivity/map-of-content/"  # MOC pattern
  - "https://obsidian.md/plugins"  # 2,700+ plugins
tags:
  - skill
  - notetaking
  - obsidian
  - meta
---

# NoteTaking / Obsidian as the Central Brain (2026)

Operate the Obsidian vault as the **single source of truth** for everything: research, business, daily, dev, creative work. Local-first markdown + a rich plugin ecosystem + AI agents (via MCP) make it the best second-brain tool in 2026.

> **Local-first wins.** Notes are plain `.md` files; no lock-in, no subscription, fully searchable, AI-ready. The agent reads/writes the vault through the `with-context` MCP (Obsidian Local REST API) or directly via filesystem.

## How to use this skill

1. **Create a new note** → [§ Note creation workflow](#note-creation-workflow) + [§ Obsidian Flavored Markdown](#obsidian-flavored-markdown-ofm-reference)
2. **Choose note type** → [§ Note taxonomy](#note-taxonomy)
3. **Link, tag, structure** → [§ Linking & tags](#linking--tags) + [§ MOCs (Maps of Content)](#mocs-maps-of-content)
4. **Use databases** → [§ Obsidian Bases (2026)](#obsidian-bases-2026)
5. **Automate** → [§ Templater](#templater) + [§ Dataview](#dataview--dataviewjs)
6. **Visual** → [§ Canvas](#canvas)
7. **AI over the vault** → [§ AI-powered workflows](#ai-powered-workflows) + [§ Smart Connections](#smart-connections)
8. **Daily / weekly** → [§ Daily & weekly notes](#daily--weekly-notes) + [§ Changelog](#changelog)
9. **Health check** → [§ Vault health](#vault-health)
10. **Reorganize** → [§ Vault organization & re-org](#vault-organization--re-org)
11. **Multi-vault** → [§ Multi-vault patterns](#multi-vault-patterns)
12. **Backup** → [§ Sync & backup](#sync--backup)

## Core conventions (the foundation)

These never change; everything else builds on them.

- **Atomic notes:** one idea per note (300–700 words), written in your own words so it stands alone; add a "link context" line explaining *why* it connects.
- **Wikilinks** `[[Note]]` and aliases `[[Note|text]]`; every new permanent note links to ≥1 existing note (relates/contradicts/extends/depends).
- **Tags classify, links connect:** front-loaded lowercase tags, ≤10/note, nested only when they roll up (`#dev/frontend`); reserve links for relationships.
- **Naming:** `kebab-case-file-slug.md` + human `title` in YAML frontmatter; dates `YYYY-MM-DD` in daily notes.
- **Folders:** shallow, ≤2 levels; prefix structure folders (`_inbox`, `_templates`, `_attachments`) so they sort apart.
- **Frontmatter is the schema** — every note has it; see [§ Frontmatter schema](#frontmatter-schema).
- **Capture first, organize later** — `_inbox` is your parking lot; promote weekly.

## Note taxonomy

Every note should fit one of these types. The type drives the template, the frontmatter, and the folder.

| Type | Purpose | Folder convention | Lifespan |
|---|---|---|---|
| **Fleeting** | Quick capture (thought, quote, link) | `_inbox/` | Days → promote or delete |
| **Literature** | Notes from someone else's work (book, article, video) | `Sources/` or `Literature/` | Permanent if reusable |
| **Permanent (Evergreen)** | Your own thinking, reusable | Domain folder (no `_` prefix) | Permanent |
| **MOC** | Index/landing for a topic | `MOCs/` | Update as you add notes |
| **Daily** | One per day | `Daily/` | Permanent, summary weekly |
| **Project** | Time-bound, multi-step work | `Projects/{slug}/` | Active + archive |
| **Meeting** | Who/what/when/decisions/action items | `Meetings/` | Permanent (audit trail) |
| **Reference** | Lookup, not for thinking (API docs, addresses) | `Reference/` | Permanent |
| **Changelog** | Log of vault changes | `Changelog/` | Permanent |
| **Skill / SOP** | How-to, repeatable | `SOPs/` or `Skills/` | Permanent |
| **Report** | Synthesized output from research | `Reports/{domain}/` | Permanent |
| **Person** | About a person (for relationships) | `People/` | Update as relationship evolves |

**Rule of thumb:** if it changes your thinking, it's permanent. If it just records what someone else said, it's literature. If it's a one-time task, it's project.

## Frontmatter schema

**YAML properties are the database fields.** Use them consistently so Bases, Dataview, and AI all work.

### Universal fields (every note)

```yaml
---
title: Human-readable title
created: 2026-08-30         # ISO date
updated: 2026-08-30         # ISO date; update on meaningful edits
type: permanent            # fleeting | literature | permanent | moc | daily | project | meeting | reference | changelog | sop | report | person
tags: [topic1, topic2]     # lowercase, hyphenated, ≤10
aliases: [Alt Name, 别名]  # alternative names for [[wikilink]] suggestions
source: ai                 # ai | human | imported; mark AI-written notes
status: draft              # draft | active | evergreen | archived
---
```

### Type-specific fields (add as needed)

| Type | Extra fields |
|---|---|
| `literature` | `author:`, `source_url:`, `source_date:`, `rating:` (1–5) |
| `project` | `start:`, `target_end:`, `status:`, `owner:`, `stakeholders:` |
| `meeting` | `date:`, `attendees:`, `decisions:`, `action_items:` |
| `person` | `role:`, `org:`, `context:`, `last_contact:` |
| `report` | `domain:`, `sources:`, `confidence:` (low/med/high), `tl_dr:` |
| `moc` | `domain:`, `note_count:`, `last_curated:` |
| `changelog` | `change_type:`, `scope:`, `version:` |
| `sop` | `domain:`, `applicability:`, `last_run:` |

### Property types (Obsidian Bases / Dataview)

- **Text:** `title: "My Note"`
- **Number:** `reading_time: 5`
- **Date:** `created: 2026-08-30` (ISO)
- **Boolean:** `archived: false`
- **List:** `tags: [a, b, c]` or YAML list with `-`
- **Link:** `parent: "[[MOC - Domain]]"`

## Note creation workflow

Every note goes through these steps. **Don't skip the linking step — orphan notes are dead notes.**

1. **Decide the type** (fleeting, literature, permanent, project, etc.)
2. **Pick the title** (human-readable, no abbreviations, no date unless daily)
3. **Add frontmatter** (use a template; see [§ Templater](#templater))
4. **Write the body** — own words, atomic, one idea
5. **Add at least one wikilink** (in or out — preferably both)
6. **Tag appropriately** (≤10 tags; nested only when rolling up)
7. **Add a "link context" line** at the bottom: `## Links` then a list of `[[related]]` with a one-line reason
8. **Save → review weekly** (inbox zero cadence)

## Obsidian Flavored Markdown (OFM) reference

> **Complete syntax reference** — based on kepano/obsidian-skills (the official Obsidian creator's published skill). Use this whenever creating or editing notes.

### Frontmatter / Properties

```yaml
---
title: My Note
date: 2026-01-15
tags: [project, active]
aliases: [Alt Name, 别名]
cssclasses: [custom-class]
---
```

- **`tags`** — searchable labels (also works as inline `#tag` in body)
- **`aliases`** — alternative names; the note is reachable by any alias via `[[wikilink]]`
- **`cssclasses`** — CSS classes for snippet-based styling

### Wikilinks (internal links)

```markdown
[[Note Name]]                          Link to note
[[Note Name|Display Text]]             Link with custom display text
[[Note Name#Heading]]                  Link to specific heading
[[Note Name#^block-id]]                Link to a block (see Block references)
```

**Prefer wikilinks** for everything inside the vault (Obsidian tracks renames automatically).
**Use Markdown links** `[text](url)` for external URLs only.

### Embeds

Prefix any wikilink with `!` to embed content inline:

```markdown
![[Note Name]]                         Embed full note
![[Note Name#Heading]]                 Embed section
![[image.png]]                         Embed image
![[image.png|300]]                     Embed image with width
![[document.pdf#page=3]]               Embed PDF page
```

### Block references (line-level linking)

```markdown
Some paragraph text. ^block-id
```

Then `[[Note#^block-id]]` links to that exact line. **Use for atomic claims you want to reuse** in multiple notes.

### Callouts

```markdown
> [!note]
> Basic callout.

> [!warning] Custom Title
> Callout with a custom title.

> [!faq]- Collapsed by default
> Foldable callout (- collapsed, + expanded).
```

**Common types:** `note`, `tip`, `warning`, `info`, `example`, `quote`, `bug`, `danger`, `success`, `failure`, `question`, `abstract`, `todo`.

**Use callouts for:** definitions, warnings, decisions, action items, FAQ entries, and key takeaways. They survive copy-paste and rendering better than ad-hoc formatting.

### Standard markdown (assumed)

- `# H1` … `###### H6` — headings
- `**bold**`, `*italic*`, `~~strike~~`
- `-` or `*` for bullets; `1.` for ordered
- `> blockquote`
- `` `inline code` ``, ` ``` ` fenced code blocks (specify language: ` ```typescript `)
- `[text](url)` for links
- `![alt](url)` for images
- `---` for horizontal rule
- Tables (GFM): `| col1 | col2 |`

### Tags

```markdown
#tag                    Inline tag
#nested/tag             Nested tag (hierarchy)
```

Tags work in frontmatter **and** in body. Inline body tags are great for quickly marking a section; frontmatter tags are easier to query.

## Linking & tags

### Linking discipline

- **Every new permanent note has ≥1 inbound AND ≥1 outbound wikilink** (or it's an orphan)
- **Use `[[Note|alias]]`** when the link text is verbose
- **Prefer "deep linking":** `[[Note#Heading]]` to specific sections, `[[Note#^block]]` to specific claims
- **Link to MOCs at the end of every domain note** so the MOC stays current
- **Don't link to something you don't intend to read** — a link is a promise

### Tag strategy

- **Tag for classification, not for connection** (links are for connection)
- **≤10 tags per note** (more = noise)
- **Lowercase, hyphenated** (`#daily-journal`, not `#DailyJournal`)
- **Nest only when rolling up** (`#dev/frontend` is fine; `#dev/frontend/react/hooks/2026` is not)
- **Convention tags (use everywhere):** `#to-process`, `#to-link`, `#to-curate`, `#archived`
- **Don't tag the obvious** — a note about React in the `dev/frontend/` folder doesn't need `#react`; folder already says it

### Tag taxonomy example (user's Zurnel vault)

```
#domain/             # topic area
domain/research
domain/business
domain/dev
domain/daily
domain/health
domain/creative

#status/             # lifecycle
status/draft
status/active
status/evergreen
status/archived

#source/             # provenance
source/ai
source/human
source/imported

#ops/                # operational
ops/to-process
ops/to-link
ops/to-curate
```

## MOCs (Maps of Content)

A MOC is a **landing note** that links to every related note on a topic. **Not a table of contents** — a curated map you update as you learn.

### MOC template

```markdown
---
title: "MOC — {Topic}"
type: moc
domain: {topic-slug}
tags: [moc, domain/{topic}]
created: 2026-08-30
last_curated: 2026-08-30
---

# MOC — {Topic}

> One-paragraph definition or framing. This is the entry point for the topic.

## Core concepts
- [[Concept A]] — the foundation
- [[Concept B]] — extends A
- [[Concept C]] — counterpoint to B

## By sub-topic
### Sub-topic 1
- [[Note 1]] — why this is here
- [[Note 2]]

### Sub-topic 2
- [[Note 3]]

## Open questions
- [ ] What about X?
- [ ] How does this relate to Y?

## Recent additions
- [[Latest note]] — added 2026-08-30
```

### MOC patterns

- **MOC per domain** (MOC — Research, MOC — Business, MOC — Dev, MOC — Daily)
- **MOC per project** (active projects)
- **MOC per person** (their interactions, work, decisions about them)
- **MOC per source** (book, course, mentor — all notes from that source)

### MOC maintenance

- **Curate monthly:** open each MOC, prune dead links, add new ones
- **Don't auto-curate via plugin** — manual curation is the value
- **A MOC with >30 notes needs sub-MOCs** — split before it becomes a wall

## Obsidian Bases (2026)

> **New in 2026.** Obsidian Bases is a **core plugin** that turns your YAML frontmatter into a filterable, editable database view. Like Notion databases, but for your local markdown.

### When to use Bases vs. plain folders

| Use case | Use |
|---|---|
| Notes that have similar structure (projects, meetings, people) | **Bases** |
| Mixed organic notes (research, ideas) | Folders + tags |
| Time-series (daily notes) | Folders + Bases filter |
| Cross-cutting queries ("all project notes tagged `urgent` and `waiting`") | **Bases** |

### Base file format (`.base`)

```yaml
title: Projects
description: All active projects
filters:
  and:
    - type == "project"
    - status != "archived"
properties:
  title:
    displayName: Project
  status:
    displayName: Status
  start:
    displayName: Start
  target_end:
    displayName: Target
views:
  - type: table
    name: Active Projects
    order:
      - title
      - status
      - start
      - target_end
  - type: board
    name: Kanban
    groupBy: status
```

### Common Bases to set up

- **Projects** (table by status, calendar by start/target_end)
- **Meetings** (table by date, filter by attendees)
- **People** (table by last_contact)
- **Literature** (table by author, rating, source_date)
- **Daily notes** (calendar view)
- **Reports** (table by domain, date)
- **Tasks / TODOs** (board by status, filter by `#to-process`)

### Bases vs. Dataview

- **Bases** is built-in, easy, and the future (Obsidian investing in it)
- **Dataview** is the older plugin; still very powerful for complex queries
- **For most use cases, Bases is enough.** Reach for Dataview when Bases can't do what you need.

## Templater

**Templater** is a community plugin that lets you insert dynamic content into notes (date, filename, prompt, system command, etc.) when creating them.

### Use case

- **Standardize frontmatter** across note types
- **Insert today's date** automatically
- **Pull in content from another note** (template inheritance)
- **Run a system command** (e.g., open a related app, fetch from API)
- **Prompt the user** for input (e.g., title, status)

### Example: Permanent-note template

```markdown
---
title: "<% tp.user.titlePrompt() %>"
created: <% tp.date.now("YYYY-MM-DD") %>
updated: <% tp.date.now("YYYY-MM-DD") %>
type: permanent
tags: [<% tp.user.tagsPrompt() %>]
status: draft
---

# <% tp.user.titlePrompt() %>

> One-sentence summary (the "thesis" of this note).

## Body

<% tp.file.cursor() %>

## Links

- [[MOC — <% tp.user.mocPrompt() %>]]
```

### Templates to maintain

```
_templates/
├── permanent.md
├── literature.md
├── daily.md
├── meeting.md
├── project.md
├── person.md
├── report.md
├── changelog.md
└── moc.md
```

## Dataview / DataviewJS

**Dataview** indexes your vault's properties and lets you query like a database. Use it inside notes (typically MOCs) to surface lists dynamically.

### Dataview query types

#### List (default)

```dataview
LIST
FROM #type/literature
WHERE author = "Cal Newport"
SORT created DESC
LIMIT 10
```

#### Table

```dataview
TABLE author, source_date, rating
FROM "Sources"
WHERE type = "literature"
SORT rating DESC
```

#### Task

```dataview
TASK
FROM #ops/to-process
WHERE !completed
```

#### Calendar (built-in)

```dataview
CALENDAR created
FROM #type/daily
```

### DataviewJS (JavaScript queries)

For complex logic, use DataviewJS:

```javascript
\`\`\`dataviewjs
const pages = dv.pages('"Projects"')
  .where(p => p.status === "active")
  .sort(p => p.target_end, 'asc');
dv.table(["Project", "Owner", "Target", "Days Left"],
  pages.map(p => [
    p.file.link,
    p.owner ?? "—",
    p.target_end ?? "—",
    p.target_end ? dv.date(p.target_end).diffNow("days") + "d" : "—"
  ])
);
\`\`\`
```

### When to use Dataview

- **When Bases doesn't fit** (very complex queries, computations)
- **For inline dashboards** in MOCs or daily notes
- **For task aggregations** across the vault

## Canvas

**Canvas** is Obsidian's infinite whiteboard. Use for spatial thinking.

### When to use

- **Brainstorming** — throw ideas onto a canvas, organize visually
- **Mood boards** — collect links, images, quotes
- **Process diagrams** — workflows, pipelines
- **Visual research** — cluster sources by theme
- **Weekly review** — drag notes into quadrants (e.g., "keep", "delete", "promote", "deep dive")

### Pattern: "Source canvas"

A canvas for each big research project:
- One card per source
- Group by sub-topic
- Color by status (read / skimmed / unread)
- Embed the synthesis note

### Pattern: "Decision canvas"

- Center: the question
- Branches: options
- Each branch: pros, cons, evidence
- Bottom: the chosen path + rationale

## Daily & weekly notes

### Daily note template

```markdown
---
title: "{{date}}"
created: {{date}}
type: daily
tags: [daily]
---

# {{date}} — {{day-of-week}}

## MITs (1–3)
1. [ ] 
2. [ ]
3. [ ]

## Schedule
- 09:00–11:00 Deep work: ...
- 14:00–15:00 Meeting: ...

## Inbox (capture anything, organize later)
- 

## Reflections (end of day)
- What went well?
- What didn't?
- Tomorrow's #1?

## Links
- [[MOC — Daily]]
```

### Weekly review (Sunday)

- [ ] Inbox empty (capture → process)
- [ ] All MITs reviewed; missed ones re-prioritized
- [ ] Top 3 wins logged
- [ ] Top 3 lessons logged
- [ ] Open loops closed or scheduled
- [ ] Week ahead: MITs + big rocks scheduled

## Changelog

> **Why a changelog:** the vault is a system; systems drift without a log. The changelog records *what changed, when, and why* — the same discipline as code commits.

### When to add a changelog entry

- Created a new MOC
- Reorganized a section of the vault
- Promoted a fleeting note to permanent
- Added a new folder / convention
- Imported external notes (e.g., from a book)
- Archived or merged notes
- Updated a skill or SOP

### Changelog entry format (YAML)

```yaml
---
date: 2026-08-30
type: add
scope: vault
---
Added `notetaking-brain` skill; introduced Bases plugin; cleaned up `_inbox` (12 notes promoted, 3 deleted).
```

## Vault health

Run these **quarterly** (or after any major reorg).

### Health checks

- [ ] **Orphan notes** — no inbound links. Use Dataview: `LIST FROM "" WHERE length(file.inlinks) = 0 AND length(file.outlinks) = 0 AND type != "daily"`. Promote, link, or delete.
- [ ] **Broken links** — `[[Note]]` to non-existent notes. Use Obsidian's "Show backlink count" or a plugin.
- [ ] **Stale tags** — tags used 0 or 1 times. Decide: promote, merge, or drop.
- [ ] **Empty notes** — created but never written. Delete or fill in.
- [ ] **Duplicates** — same content in two places. Merge.
- [ ] **Frontmatter drift** — missing required fields (title, type, created, tags). Use Templater + a validation step.
- [ ] **MOC staleness** — MOCs not curated in 6+ months. Schedule a curation pass.
- [ ] **Folder structure** — still matches conventions? Any orphans?
- [ ] **Daily notes missed** — gap in daily sequence? Either write or accept the gap.

### Tools

- **Dataview** for queries
- **Obsidian's built-in "Unlinked mentions"** for latent links
- **Plugins:** "Janitor", "Find orphaned files", "Tag wrangler"
- **Manual review** for MOCs

## Vault organization & re-org

Re-organizing is risky. **Always propose before executing.** Use the dry-run pattern:

### Dry-run pattern

1. **List** what you'd change (move, rename, merge, delete) — with confidence per change
2. **Group** by intent (e.g., "MOC consolidation", "tag cleanup", "folder rename")
3. **Estimate impact** — how many notes, what links break
4. **Commit baseline** (`git commit` if using obsidian-git)
5. **Execute in batches** — one intent at a time; verify between batches
6. **Log** the change in the changelog

### Re-org anti-patterns

- ❌ Move notes without updating links (Obsidian usually handles this, but external links break)
- ❌ Reorganize without a clear trigger (don't "tidy" for tidiness's sake)
- ❌ Delete without checking links first
- ❌ Use a 3+ level folder hierarchy
- ❌ Reorganize during a creative flow (do it on a maintenance day)
- ❌ Skip the changelog

## AI-powered workflows

> **2026 reality:** an Obsidian vault + an AI agent (via MCP) = the most powerful personal knowledge system. The agent reads, writes, searches, and reasons over your notes as context.

### The `with-context` MCP (already in your stack)

The user's OpenCode already has the `with-context` MCP for Obsidian Local REST API. **Use it as the primary tool for all vault operations.**

**Key operations:**
- `list_templates()` — see available templates
- `read_note(path)` — read a note
- `write_note(path, content)` — create or update
- `patch_note(path, changes)` — partial update
- `append_to_note(path, content)` — append
- `delete_note(path)` — delete
- `search_notes(query)` — full-text search
- `get_tags()`, `get_backlinks()`, `list_notes_in_folder(path)`
- `add_changelog_entry(...)` — log a vault change
- `get_commit_suggestion(...)` — for obsidian-git workflow

**Always check `list_templates()` first** to know what templates are available.

### AI workflow patterns

#### 1. **Capture → process** (most common)

```
User: "save this idea: ..."

Agent:
  1. append_to_note("Daily/{today}.md", "## Inbox\n- {idea}")  # capture to today's daily
  2. weekly: process the inbox (promote to permanent, link, tag)
```

#### 2. **Research → permanent note**

```
User: "research X and save what you find"

Agent:
  1. Use deep-research skill to gather
  2. Create permanent note: write_note("Notes/X.md", ...)
  3. Add wikilinks to related MOC: append_to_note("MOCs/{domain}.md", "- [[X]] — ...")
  4. Add changelog entry
```

#### 3. **MOC maintenance**

```
User: "curate the {topic} MOC"

Agent:
  1. Read the MOC
  2. Search for related notes (search_notes or Dataview)
  3. Suggest additions / removals (don't auto-apply; review)
  4. Update MOC and log
```

#### 4. **Question → answer from vault**

```
User: "what do I know about X?"

Agent:
  1. search_notes("X") + semantic_search for meaning
  2. Read top 3–5 matches
  3. Synthesize (with citations: [[Note]], [[Note#Section]])
  4. Offer to save the synthesis as a note
```

#### 5. **Daily plan → write to daily**

```
User: "plan my day"

Agent:
  1. Read HANDOFF.md (current state)
  2. Use daily-planning skill
  3. append_to_note("Daily/{today}.md", "## MITs\n...")
```

### AI agent discipline (read this)

- **Always read before writing** — never overwrite a note you haven't read
- **Atomic edits** — change one thing at a time
- **Preserve existing structure** — match the file's style
- **Never delete without asking** — confirm before any delete
- **Add changelog entries for every meaningful change**
- **Link before you leave** — every new note gets ≥1 wikilink
- **Use templates** for any new permanent note

## Smart Connections

**Smart Connections** is a community plugin that lets you **chat with your vault** using any AI model (local via Ollama, or cloud). It uses RAG (retrieval-augmented generation) over your notes to ground answers in your own knowledge.

### Use cases

- "What have I written about X?" — semantic search
- "Summarize my notes from last week"
- "Find contradictions between my notes on Y"
- "Generate 5 blog post ideas from my research notes"

### When to use

- **For semantic search** — better than keyword for fuzzy recall
- **For Q&A over your vault** — "what was that quote from Cal Newport about deep work?"
- **For synthesis** — generate a draft from your notes

### When NOT to use

- **For exact lookups** — Obsidian's built-in search is faster
- **For sensitive data** — depends on model; check if data leaves your machine
- **For replacing your own thinking** — the value is in your framing, not the synthesis

## Multi-vault patterns

> **When to use multiple vaults** — different contexts with different audiences, security, or sync needs.

| Use case | Single vault? | Multi-vault? |
|---|---|---|
| Personal + work | If they overlap (most people) | If they must stay strictly separate (e.g., compliance) |
| One client | Single | — |
| Multiple clients | — | One vault per client + a personal "meta" vault |
| Public + private | — | Public vault is published; private is the source |
| Different sync devices | Single (with Obsidian Sync) | — |
| Sensitive topics | — | One vault, encrypted at rest |

### Recommended structure (user's setup)

- **Zurnel** (master vault) — knowledge, second brain, cross-domain
- **Optional project vaults** — time-bound, isolated, archived at end

### Cross-vault linking

- **Avoid cross-vault wikilinks** (they don't resolve)
- **Use a "MOC — Across Vaults"** in the main vault with explicit references (titles, links to where the note lives)
- **Or merge** if the separation isn't earning its keep

## Sync & backup

> **Don't lose your brain.** Three layers of safety.

### Layer 1 — Versioned backup (the floor)

- **obsidian-git** plugin + a git repo (GitHub private, GitLab, or self-hosted)
- **Auto-commit** every 5–10 minutes (configurable) + on close
- **Tracked:** all notes + `.obsidian/` config (selectively)
- **Ignored:** workspace.json (ephemeral), trash, caches, large attachments (use git LFS or external for those)

### Layer 2 — Live sync across devices

- **Obsidian Sync** (official, paid) — encrypted, conflict-aware, per-vault
- **OR** Syncthing / Dropbox / iCloud — works, but conflicts can lose data
- **For most users:** Obsidian Sync if you can afford it; Syncthing if you can't (but be careful with conflicts)

### Layer 3 — Offsite backup

- **Daily backup of the vault folder to a different location** (Backblaze, S3, external drive)
- **Automate** with a cron/systemd timer
- **Test restore** quarterly (a backup you can't restore is not a backup)

### Backup discipline

- [ ] obsidian-git installed and committing
- [ ] Remote (GitHub/GitLab) configured
- [ ] Offsite backup automated
- [ ] Tested restore in the last 90 days
- [ ] Attachments strategy decided (in vault / external / cloud)

## Idea vault & creative pursuit

- **Capture fast and disposable** into `_inbox` (fleeting → literature/own-words → permanent) and burn it down regularly
- **Progressive summarization:** bold core ~10–20%, highlight best-of-bold ~2–4%, add a 2–3 sentence `## Summary`
- **AI may draft L2–L4**; the final remix stays a human act
- **Ideas connect to existing permanent notes** before creating new ones — if a note already covers it, extend instead of duplicate

## Changelog & history

- **One `YYYY-MM-DD.md` daily note per day** in `Daily/`; periodic summaries reference the dailies via links
- **Log vault changes** with `with-context_add_changelog_entry` (conventional types: `add`, `update`, `remove`, `reorg`, `merge`) + `with-context_get_commit_suggestion`
- **Mark AI-written notes** `source: ai` in frontmatter
- **For durable history** keep the vault in git (obsidian-git): track notes + config only; ignore `.obsidian/workspace.json`, trash, caches
- **Commit-and-sync** with a templated message: `chore: daily — {date}` or `feat: add MOC — {topic}`

## Helpful suggestions (agent behavior)

- **After any domain task** (research/dev/daily), offer to save a linked vault note
- **Surface weak clusters:** notes related but unlinked — propose one new link
- **Suggest new-MOC opportunities** when a domain grows past ~6–8 notes
- **Run vault health** quarterly and offer a summary
- **Use the existing templates** — `list_templates()` first

## Guardrails / anti-patterns

- ❌ Reorganize the vault without a dry-run plan and approval
- ❌ Create duplicate notes; link + extend first
- ❌ Put permanent knowledge inside time-bound project folders
- ❌ Skip frontmatter (makes Bases/Dataview useless)
- ❌ Tag-spam (>10 tags/note)
- ❌ Use 3+ level folder hierarchies
- ❌ Edit in place without `git` history (no safety net)
- ❌ Delete notes without checking links first
- ❌ Write AI notes without marking `source: ai`
- ❌ Put secrets (API keys, tokens) in notes
- ❌ Over-engineer: a 3-note MOC for a 3-note domain is overkill
- ❌ Skip weekly review — the inbox grows
- ❌ Use emoji folders (`📁_inbox`) — breaks search and CLI tools

## Tools in our stack (Zurnel vault)

- **Obsidian** (desktop + mobile) — primary client
- **`with-context` MCP** — agent's interface to the vault
- **Plugins (recommended set):**
  - **Templater** — templates + dynamic content
  - **Dataview** — query layer (use Bases when possible; Dataview for complex)
  - **Canvas** — built-in
  - **Smart Connections** — RAG over vault
  - **obsidian-git** — version control + backup
  - **Tag wrangler** — tag management
  - **Janitor** — clean empty/duplicate notes
  - **Excalidraw** — hand-drawn diagrams
  - **Make.md** — workspace + homepage
  - **Calendar** — daily note navigation
- **Obsidian Bases** — built-in (2026)
- **Obsidian Sync** (optional, paid) — multi-device
- **Skills:** `domain-orchestrator` (routing), `deep-research` (vault sourcing), `business-planning` (Nepal reports), `development-workflows` (ADRs), `daily-planning` (daily notes)

## Related skills

- `domain-orchestrator` (routing), `deep-research` (sources for notes), `business-planning` (Nepal reports go in vault), `development-workflows` (ADRs), `daily-planning` (daily notes), `linux-poweruser` (for backup automation, obsidian-cli)
