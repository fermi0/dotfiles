---
description: Weekly vault maintenance loop (Phase 4 Recipe D) — analyze, dry-run plan, hygiene scan, changelog
agent: build
---

Perform the weekly Zurnel vault maintenance loop (`~/shared/Zurnel`). Read-only + dry-run by default — NEVER delete/move without user approval.

Steps (per `Zurnel/reports/phase4/phase4-cross-domain-recipes.md` Recipe D):

1. **Analyze** — `with-context_analyze_vault_structure` on the vault root (include orphans). Note md counts per folder vs last run (expected stable folders: Books, SQL, Study, Health, Phase3, Curious Cat, Scribble, AI, Research, Poetry, Excalidraw, Linux, reports).
2. **Plan** — if reorganization is warranted, `with-context_generate_organization_plan` preset `research`, then present the dry-run diff to the user. Do NOT apply without explicit approval (approval → `reorganize_notes` with `create_backup=true, update_links=true`).
3. **Hygiene scan** — report only:
   - orphan notes (no inbound/outbound links) via Janitor-style scan,
   - duplicate/conflicted copies (`*(conflicted copy)*` patterns),
   - empty (<3 content lines) files,
   - broken image embeds count,
   - secrets scan: `git grep -lE 'gho_|ghp_|github_pat_|sk-' $(git rev-list --all)` must return nothing,
   - `git status` — flag untracked/modified files and any `~HEAD` conflict dirs.
4. **MOC check** — verify each content folder still has its folder note (Books.md, Study.md, …); list missing ones.
5. **Report** — write findings to `reports/maintenance/YYYY-MM-DD.md` in the vault (`with-context_write_note`, project folder `reports`), and append a one-line `chore` changelog entry there.

Output format: compact table of findings + "needs approval" section (empty if none). Keep it under 40 lines.
