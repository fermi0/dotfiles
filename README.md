# /home/shared/dotfiles/

The single source of truth for the **work** account's dotfiles, scripts, and
system-level configuration on this machine.

## Goals

- **One repo, many domains.** `config/`, `scripts/`, `data/`, `os/`, `meta/`.
- **Git is the audit log.** Every meaningful change is a commit.
- **Symlinks, not copies.** Files in `~/.config/`, `~/scripts/`, `~/data/`, and
  `~/.lemma/` are symlinks to the corresponding paths in this repo.
- **No backup beyond git.** Per user decision, 2026-08-31. The repo is the
  backup.
- **Atomic stages.** Each migration step is one commit, one rollback.

## Branches

- `main` — the source of truth. Only merged after verification.
- `Playground` — throwaway experiments. Force-push allowed. Never merged.

## Layout (target)

```
dotfiles/
├── README.md          ← you are here
├── _index.md          ← MOC for the dotfiles repo
├── .gitignore
├── config/            ← ~/.config/ symlinked wholesale per-package
├── local/             ← ~/.local/share/ symlinked selectively
├── scripts/
│   ├── system/        ← utilities (install-plugins.sh, zurnel-snapshot.sh, ...)
│   ├── business/      ← (reserved) daily-news-scan.sh, news-delta-detector.py
│   └── legacy/        ← gitignored; for review of old /home/shared/scripts/
├── data/              ← schema + seed only; runtime *.db is gitignored
├── os/                ← system-level restore (pacman, AUR, flatpak manifests)
└── meta/              ← AGENTS.md, ecosystem map, this file's MOC companion
```

## Migration history (dry-run)

| Stage | What | Status |
|---|---|---|
| 1 | init repo | done 2026-08-31 (c495bc7) |
| 2 | move ~/scripts/ | done 2026-08-31 (9997d05) |
| 3 | move /home/shared/scripts/ legacy | done 2026-08-31 (no git diff; legacy/ is gitignored; 90 MB moved to scripts/legacy/) |
| 4 | move ~/data/business.db | done 2026-08-31 (no git diff; real db is in shared/data/business/, top-level symlink to match opencode's --db-path) |
| 5 | move ~/.lemma/ | done 2026-08-31 (40→36 at first commit; 42 after post-restart re-adds of 4 truly-lost stage fragments; see Reports/Mind-Palace-Stage5-ReAdd-List-2026-08-31.md) |
| 6 | disable opencode-mem | done 2026-08-31 (no git diff in dotfiles repo; removed `opencode-mem` from `~/.config/opencode/opencode.jsonc` plugin array; deleted `~/.opencode-mem/` 534 MB) |
| 7 | delete 3 stale daily-reflection timer pairs | done 2026-08-31 (no git diff in dotfiles repo; stopped+disabled+removed 28/29/30 .service and .timer; only 31st remains) |
| 8 | import hand-edited configs from ~/.config/ | done 2026-08-31 (`f71bb5e`, 637 files, 19 packages; all byte-identical; waybar symlinks fixed to be relative; verification report at `~/Work/Zurnel/Reports/Mind-Palace-Stage8-Verification-2026-08-31.md`) |
| 4 | move ~/data/business.db | pending |
| 5 | move ~/.lemma/ | pending |
| 6 | disable opencode-mem + delete ~/.opencode-mem/ | pending |
| 7 | delete 3 stale daily-reflection timer pairs | pending |
| 8 | import hand-edited configs (copy, no symlink) | pending |

Full plan: `~/Work/Zurnel/Reports/Mind-Palace-Dryrun-2026-08-31.md`

## Remote

- `git@github.com:fermi0/dotfiles.git`
- Identity: fermi0 &lt;fermi4676.e@gmail.com&gt; (set in `~/.gitconfig`)
- SSH key: `~/.ssh/id_git` (no `~/.ssh/config` yet; use `GIT_SSH_COMMAND`)

## See also

- `~/Work/Zurnel/Reports/Mind-Palace-Survey-2026-08-31.md` — the pre-migration survey
- `~/Work/Zurnel/Reports/Mind-Palace-Dryrun-2026-08-31.md` — the 8-stage plan
- `~/Work/Zurnel/Init/HANDOFF.md` — the handoff doc that started Q6
