---
created: 2026-08-31
modified: 2026-08-31
type: subdir-index
status: post-stage2
---

# scripts/ — MOC

> All shell and Python scripts on this machine, organized by domain.

## `system/`

Utilities for the **work** account's daily system operations.

- `install-plugins.sh` — opencode plugin installer (used by the 2026-08-30 vault reorg)
- `zurnel-snapshot.sh` — Obsidian vault snapshot (uses `obsidian-git`-style commit + push)
- `fzf-preview.sh` — fzf preview helper for git/awesome-fzf
- `chrome-color-fix.sh` — chrome/chromedevtools color profile fix

## `business/` (reserved)

Nepal Business Intelligence scripts.

- `daily-news-scan.sh` — (reserved) daily scrape of NRB/MOF/SEBON/NEPSE news
- `news-delta-detector.py` — (reserved) diff between yesterday and today's news

## `legacy/` (gitignored)

Old `/home/shared/scripts/` content (2024-era). Held for user review.

- `payload.py` — old payload script, purpose unknown
- `sms_client.py` — old SMS client, purpose unknown
- `sqlqueries/` — SQL practice queries

## See also

- `~/scripts/` — symlink to this directory (`/home/shared/dotfiles/scripts/`)
- Repo README — migration history table
