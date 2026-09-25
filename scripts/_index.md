---
created: 2026-08-31
modified: 2026-09-25
type: subdir-index
status: active
---

# scripts/ — MOC

## system/

- `opencode-restore.sh` — collision-safe restore with `--check`, `--dry-run`, and `--links-only`
- `zurnel-snapshot.sh` — vault snapshot and Git bundle workflow
- `obsidian-sync` — vault sync helper
- `lf-paste-progress` — lf paste progress helper
- `fzf-preview.sh` — fzf preview
- `install-plugins.sh` — plugin installation helper

## audio/

OpenSCQ30 and Soundcore setup helpers, including the connection watchdog and Liberty/Space One scripts.

## llama/

Build, serve, warmup, and slot-management wrappers for llama.cpp.

## news/

`daily-news-scan.sh` — scheduled Nepal news scan used by opencode-scheduler.

## fzf/

Completion scripts and Python helpers sourced by zsh.

## yazi/

Yazi shell helpers installed into `~/.local/bin`.

## legacy/

Ignored 2024 scripts and database backups retained for review. This tree is not part of restore.

## Deployment

`~/scripts` links to this directory. Restore-managed commands are linked into `~/.local/bin`.
