---
created: 2026-08-31
modified: 2026-08-31
type: repo-index
status: post-stage1
---

# dotfiles — MOC

> Map of Content for `/home/shared/dotfiles/`. The repo is the source of truth;
> this file is the index that makes it navigable.

## Top-level

- `README.md` — overview, goals, branches, layout, migration history
- `_index.md` (this file) — MOC
- `.gitignore` — files excluded from version control

## `config/` (populated in stage 8)

Hand-edited config files imported from `~/.config/`. Per-package README to be
added with each import.

## `local/` (reserved, future stage)

Selected entries from `~/.local/share/` that are worth tracking (applications
directory, .desktop files).

## `scripts/` (populated in stages 2 and 3)

- `scripts/system/` — utilities: `install-plugins.sh`, `zurnel-snapshot.sh`,
  `fzf-preview.sh`, `chrome-color-fix.sh`
- `scripts/business/` — (reserved) Nepal BI scripts after survey
- `scripts/legacy/` — gitignored, holds the 2024-era `/home/shared/scripts/`
  for user review

## `data/` (reserved, future stage)

- `data/business/` — `business.db` runtime data lives in `/home/shared/data/`
  (gitignored); the schema lives in `data/business/schema.sql` (tracked)
- `data/lemma/` — same pattern for `lemma.db`

## `os/` (reserved, future stage)

- `os/packages-pacman.txt` — `pacman -Qeqt` output
- `os/packages-aur.txt` — `yay -Qm` output
- `os/packages-flatpak.txt` — `flatpak list` output
- `os/restore.sh` — system restore script

## `meta/` (reserved, future stage)

- `meta/AGENTS.md` — symlink target for the global agent context
- `meta/ecosystem.md` — the `/home/shared/` + `/home/<user>/` split explained

## See also

- `README.md` — goals, branches, remote, migration history
- `~/Work/Zurnel/Reports/Mind-Palace-Dryrun-2026-08-31.md` — the 8-stage plan
