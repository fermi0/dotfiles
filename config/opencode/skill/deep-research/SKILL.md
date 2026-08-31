---
name: deep-research
description: Extensive multi-pass research using all available tools via Code Mode. Use when the user asks to research a topic deeply, find all available information, read published papers/resources, compare technologies, make informed decisions, or any task requiring broad web discovery + deep reading.
created: 2026-08-30
status: draft
sources:
  - "https://arxiv.org/abs/2508.12752"  # Deep Research: A Survey of Autonomous Research Agents (Aug 2025)
  - "https://github.com/assafelovic/gpt-researcher"  # planner/execution/publisher architecture
  - "https://github.com/bytedance/deer-flow/blob/main/skills/public/deep-research/SKILL.md"  # 3-phase methodology
  - "https://github.com/langgptai/awesome-deep-research-prompts"  # 2026 deep-research tools landscape
  - "https://www.tavily.com/"  # modern search API for agents
tags:
  - skill
  - research
  - meta
---

# Deep Research (Code Mode Required)

**CRITICAL: This skill MUST use the `execute` tool (Code Mode) for ALL web research.**
The built-in `websearch` and `webfetch` tools are NOT sufficient for extensive research.

## Why Code Mode?

| Tool | Access | Coverage |
|------|--------|----------|
| `websearch` (built-in) | Direct | Provider's own index only, 5-10 results |
| `webfetch` (built-in) | Direct | Single URL fetch only |
| `searxng_web_search` (SearXNG MCP) | **Code Mode** | 70+ search engines, full web |
| `web_url_read` (SearXNG MCP) | **Code Mode** | Read any URL with metadata |
| `fetch_url` (fetch MCP) | **Code Mode** | HTML/Markdown conversion |
| `fetch_youtube_transcript` (fetch MCP) | **Code Mode** | Video transcripts |
| `browser_*` (playwright MCP) | **Code Mode** | JS-heavy sites, login-walled pages |
| `query-docs` (context7 MCP) | **Code Mode** | Library/framework docs |
| `sequentialthinking` MCP | **Code Mode** | Multi-step reasoning |

**Discover tools first:** when in doubt, call `await tools.$codemode.search({query: "<intent>"})` to find the right tool.

## When to load this skill

**Always load when:**
- User asks "what is X", "explain X", "research X", "investigate X", "compare X and Y"
- A single web search would be insufficient
- Pre-research for any content generation (article, report, presentation, dashboard, video script)
- User asks for "deep" / "thorough" / "comprehensive" coverage
- Task requires current, multi-source, evidence-grounded information

**Skip when:**
- A direct fact-lookup would suffice ("what year was X released")
- The question is about the user's local environment (use linux-poweruser)
- The user is asking you to recall something you already know

## Canonical 4-stage pipeline

This is the formal pipeline from the 2025 deep-research survey (arXiv 2508.12752) and confirmed by GPT Researcher / Deer-Flow:

```
┌──────────────────────────────────────────────────────┐
│ 1. PLAN         →  decompose the question            │
│ 2. DEVELOP      →  generate sub-questions per angle  │
│ 3. EXPLORE      →  retrieve + read + verify sources  │
│ 4. SYNTHESIZE   →  report with citations             │
└──────────────────────────────────────────────────────┘
   each stage may iterate back to the previous one
```

### Stage 1 — Plan

- Restate the question in your own words; identify the **type** of question (factual, comparative, evaluative, exploratory, predictive).
- Define **scope boundaries**: geography, time range, audience, depth (executive vs. expert).
- State your **prior estimate** of the answer before researching (anchoring control).
- Identify the **deliverable shape**: brief, long report, comparison matrix, decision memo, source dossier, dataset.

### Stage 2 — Develop sub-questions

Generate 5–15 sub-questions across these **information types** (Deer-Flow diversity model):

| Information type | Purpose | Example queries |
|---|---|---|
| **Facts & data** | Concrete evidence | `"X statistics"`, `"X market size"`, `"X benchmark"` |
| **Examples & cases** | Real-world usage | `"X case study"`, `"X implementation"`, `"X production"` |
| **Expert opinions** | Authority perspective | `"X expert analysis"`, `"X interview"`, `"X commentary"` |
| **Trends & predictions** | Direction of travel | `"X trends 2026"`, `"X forecast"`, `"future of X"` |
| **Comparisons** | Alternatives | `"X vs Y"`, `"X alternatives"`, `"X comparison"` |
| **Challenges & critiques** | Honest balance | `"X limitations"`, `"X criticism"`, `"X problems"` |
| **History & origins** | Context | `"X history"`, `"origin of X"`, `"how X evolved"` |

For each sub-question: write a **specific query** (not a topic word), include **temporal precision** (see below), and note which **source tier** (see Source Quality below) is most likely to answer it.

### Stage 3 — Explore (multi-pass, parallel)

**Pass 1 — Broad discovery (SearXNG, parallel).**
```javascript
const queries = [
  "{topic} overview",
  "{topic} {current year}",  // <-- always use ACTUAL current year
  "{topic} site:arxiv.org",
  "{topic} site:github.com",
  "{topic} case study"
];
const results = await Promise.all(queries.map(q =>
  tools.searxng.searxng_web_search({query: q, maxResults: 10})
));
```

**Pass 2 — Triage & read top results in full.**
```javascript
const urls = /* pick 8-15 most promising */;
const pages = await Promise.all(urls.map(u =>
  tools.fetch.fetch_url({url: u, max_length: 8000})
));
```

**Pass 3 — Deep dive (follow citations, related work, primary sources).**
- `tools.searxng.searxng_web_search({query: '"<exact phrase>"'})` for verbatim claims
- `tools.playwright.browser_*` for JS-heavy or login-gated pages
- `tools.context7.query-docs` for library/framework documentation
- `tools.fetch.fetch_youtube_transcript` for video evidence
- Follow `References` / `Bibliography` sections in academic sources

**Pass 4 — Triangulate & verify.**
- For every load-bearing claim, find ≥2 independent sources OR label it explicitly as an assumption
- Cross-check numbers (different sources should converge within 10–20%)
- For contested claims, present both sides with their evidence

**Pass 5 — Synthesize (see Stage 4).**

### Stage 4 — Synthesize

**Output structure (report template):**
```markdown
# {Title}

## TL;DR
{3–5 sentences; the answer up front}

## Question & scope
{restate the question, define boundaries}

## Key findings
{numbered list of 5–12 findings, each with citation [1], [2], …}

## Evidence
### Facts & data
### Examples & cases
### Expert opinions
### Trends & predictions
### Comparisons
### Challenges & critiques

## Synthesis
{the integrative analysis; where do findings agree, disagree, what does it mean}

## Open questions / unknowns
{what you couldn't find, what would change the conclusion}

## Sources
[1] {Title} — {Author/Org} — {URL} — accessed {YYYY-MM-DD} — tier {T1/T2/T3}
[2] …
```

**Citation format:** `[N] Title — Author/Org — URL — accessed YYYY-MM-DD — tier T1|T2|T3`

## Source Quality Framework

Every source gets a tier; cite the tier so the reader knows the weight.

| Tier | Definition | Examples | Weight |
|---|---|---|---|
| **T1 — Primary / authoritative** | Original data or peer-reviewed; first-party documentation | arXiv papers, peer-reviewed journals, official specs (RFC, W3C), government statistics (census, BLS), company official docs, SEC filings, court records | Highest |
| **T2 — Reputable secondary** | Established outlets with editorial standards | Reuters/AP/Bloomberg, McKinsey/BCG/Gartner/HBR, arXiv-aggregated surveys, well-known industry analysts, Wikipedia (for orientation only) | High |
| **T3 — Useful but unverified** | Blog posts, forum answers, marketing content, AI-generated summaries | Medium articles, dev.to, Reddit, company blog claims, vendor whitepapers | Medium — needs corroboration |
| **Avoid** | Anonymous, undateable, or AI-only sources with no provenance | Unsigned Medium posts, scraped content with no original, content farms | Lowest — never load-bearing |

**Rule of thumb:** a load-bearing claim needs **≥2 sources, at least one of which is T1 or T2**. A claim supported only by T3 must be labeled as such.

## Temporal awareness

**Always check `<current_date>` in your context before forming any search query.** The right level of precision depends on user intent:

| User intent | Temporal precision | Example query |
|---|---|---|
| "today / this morning / just released" | Month + Day | `"AI news August 30 2026"` |
| "this week" | Week range | `"tech releases week of Aug 24 2026"` |
| "recently / latest / new" | Month | `"LLM benchmarks August 2026"` |
| "this year / trends" | Year | `"SaaS trends 2026"` |
| "historically" | None | `"history of X"` |
| "ever / always" | None | `"X breakthroughs"` |

❌ `User asks "what's new today" → "new technology 2026"` → misses today's news
✅ `User asks "what's new today" → "AI news August 30 2026"` → gets today's results

## Effective query patterns

```
# Be specific with context
❌ "AI trends"
✅ "enterprise AI agent adoption trends 2026"

# Add authoritative hints
"[topic] research paper"
"[topic] McKinsey report"
"[topic] arxiv"
"[topic] official documentation"

# Specify content type
"[topic] case study"
"[topic] statistics"
"[topic] expert interview"
"[topic] benchmark"

# Use site: for known repositories
"site:arxiv.org [topic]"
"site:github.com [topic]"
"site:sec.gov [company]"
"site:who.int [topic]"

# For verbatim claims
'"exact phrase" statistics'
'"exact phrase" study'

# For contradictions
"[topic] criticism"
"[topic] limitations"
"[topic] failed"
```

## Handling contradictions

When sources disagree:
1. **Surface the disagreement** explicitly — don't paper over it
2. Compare **source tiers** (T1 source beats T3 source)
3. Compare **recency** (newer data may reflect new reality)
4. Compare **scope** (different geographies / segments / definitions)
5. Present **both positions** with their evidence in the report
6. Note **which would change your conclusion** in "Open questions"

## Stopping criteria (quality bar)

Research is sufficient when you can answer **YES** to all of these:
- [ ] I've covered all 7 information types (or justified skipping some)
- [ ] Every load-bearing claim has ≥2 independent sources, ≥1 of which is T1/T2
- [ ] I've explicitly addressed contradictions and limitations
- [ ] I have current data (within the temporal scope the user implied)
- [ ] I have at least one primary or peer-reviewed source if the topic is technical
- [ ] I have at least one concrete example / case
- [ ] I have at least one expert or authoritative opinion
- [ ] I can write a TL;DR that names the key finding confidently
- [ ] I can name 2–3 things I couldn't find or that remain uncertain

**If any answer is NO, continue researching before synthesizing.**

## Iterative refinement

Research is iterative. After each pass:
1. Review what you've learned
2. Identify **gaps** in your understanding
3. Formulate **new, more targeted** queries
4. **Loop back** to Stage 2 (Develop) and add sub-questions for the gaps
5. Repeat until the quality bar is met

## Tool reference (Code Mode)

| Namespace | Key tools | Use for |
|---|---|---|
| `searxng` | `searxng_web_search`, `web_url_read`, `searxng_search_suggestions` | Discovery + URL reading |
| `fetch` | `fetch_url`, `fetch_youtube_transcript` | Full content + video |
| `playwright` | `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_evaluate` | JS-heavy / gated pages |
| `context7` | `query-docs`, `resolve-library-id` | Library/framework docs |
| `sequential-thinking` | `sequentialthinking` | Multi-step reasoning |
| `filesystem` | `read_file`, `write_file`, `search_files` | Local code/doc reading |
| `with-context` | (Obsidian REST) | Save research to vault |

## Common mistakes to avoid

- ❌ Stopping after 1–2 searches
- ❌ Relying on snippets without reading full sources
- ❌ Searching only one aspect of a multi-faceted topic
- ❌ Ignoring contradicting viewpoints or challenges
- ❌ Using outdated information when current data exists
- ❌ Generating content before research is complete
- ❌ Citing a source without reading it
- ❌ Treating T3 sources as T1
- ❌ Using a hard-coded past year ("2024") instead of `<current_date>`
- ❌ One web search is NEVER enough
- ❌ Never fabricate sources — if you can't verify, say "not found"

## Storage pattern (for large research outputs)

For research that produces >2 pages of output, **persist to the Obsidian vault**:
- Folder: `~/Work/Zurnel/Research/{topic-slug}/`
- Files: `00-question.md`, `10-findings.md`, `20-sources.md`, `30-report.md`
- Frontmatter: `source: ai`, `verified: <date>`, `tags: [research, <topic>]`
- Cross-link from `Research/Research.md` index

## Related skills

- `domain-orchestrator` (routing), `business-planning` (if research feeds a business decision), `notetaking-brain` (vault storage), `development-workflows` (if research is technical)
