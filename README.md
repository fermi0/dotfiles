# dotfiles

The single source of truth for dotfiles, scripts, and system-level configuration on this machine.

## Layout

```
dotfiles/
├── README.md          ← this file
├── _index.md          ← MOC for the dotfiles repo
├── .gitignore
├── config/            ← ~/.config/ symlinked wholesale per-package
├── local/             ← ~/.local/share/ symlinked selectively
├── scripts/
│   ├── system/        ← utilities (install-plugins.sh, zurnel-snapshot.sh, ...)
│   ├── business/      ← (reserved) daily-news-scan.sh, news-delta-detector.py
│   └── legacy/        ← gitignored; for review of old scripts/
├── data/              ← schema + seed only; runtime *.db is gitignored
├── os/                ← system-level restore (pacman, AUR, flatpak manifests)
└── meta/              ← AGENTS.md, ecosystem map, this file's MOC companion
```

## Symlinks

Files in `~/.config/`, `~/scripts/`, `~/data/`, and `~/.lemma/` are symlinks to the corresponding paths in this repo. No copies, no backups beyond git.

## Remote

- **Repository:** [git@github.com:fermi0/dotfiles.git](https://github.com/fermi0/dotfiles)
- **Identity:** fermi0
- **SSH key:** `~/.ssh/id_git`

## See also

- `_index.md` — MOC for the dotfiles repo
