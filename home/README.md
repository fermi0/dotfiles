# home/ — shell config files for the work account

These are the dotfiles from `~/` (the work user's home directory).

## Current files

- `.zshrc` — zsh shell config. Restored from `~/.config/zsh-backup/.zshrc` (Aug 26 backup) on 2026-09-01 after the user accidentally deleted the original.
- `.aliasrc` — shell aliases. Partially recovered from nvim undo file `~/.local/state/nvim/undo/%home%work%.aliasrc` on 2026-09-01. Only the `fzf` alias was recoverable; other aliases are LOST.

## What's missing

- `.zprofile` — was never in work's home (only in oppenheimer's, which has a different setup)
- `.icons/` — 79,824 files of icon/cursor themes; package-managed, restored via pacman

## Recovery history

- 2026-09-01: user accidentally deleted `~/.zshrc` and `~/.aliasrc`
- 2026-09-01: `.zshrc` restored from `~/.config/zsh-backup/.zshrc` (Aug 26 backup, 5,274 bytes, has NIM key, OpenRouter key, oh-my-zsh, sheldon, swarm plugin model)
- 2026-09-01: `.aliasrc` partially recovered from nvim undo file (only `fzf` alias survived)
- 2026-09-01: `.zprofile` was never in work's home; not recoverable

## Symlink plan (future stage)

After verifying these files work, they should be symlinked:
- `~/.zshrc` → `/home/shared/dotfiles/home/.zshrc`
- `~/.aliasrc` → `/home/shared/dotfiles/home/.aliasrc`

This is a future stage (not part of the current mind-palace migration).
