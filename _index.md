---
created: 2026-08-31
modified: 2026-09-25
type: repo-index
status: active
---

# dotfiles — MOC

## Top level

- `.aliasrc` — live shell aliases
- `.zshrc` — live zsh configuration
- `.gitignore` — repository-wide exclusions
- `README.md` — restore and architecture overview
- `_index.md` — this map

## `config/`

- `config/README.md` — managed package inventory
- `config/opencode/` — global OpenCode configuration and plugins
- `config/oc-local/` — isolated local-model configuration
- `config/hypr/` — active Hyprland configuration
- `config/pipewire/` — active PipeWire configuration
- `config/wireplumber/` — active WirePlumber configuration
- `config/systemd/` — tracked user-unit sources
- `config/zen/` — Zen theme source and preferences template

Most managed package directories are deployed as `~/.config` symlinks. `~/.config/systemd` is a real directory whose unit files link back here, preventing generated scheduler state from writing into Git.

## `scripts/`

- `scripts/system/` — restore, snapshots, plugin and system utilities
- `scripts/audio/` — Soundcore/OpenSCQ30 automation
- `scripts/llama/` — llama-server lifecycle helpers
- `scripts/news/` — scheduled news scan
- `scripts/fzf/` — completion and preview helpers
- `scripts/yazi/` — Yazi helper commands
- `scripts/legacy/` — ignored 2024 material retained for review

## `agents/`

OpenCode skills deployed at `~/.agents`.

## `os/`

- `os/pacman.txt` — explicit repository packages
- `os/aur.txt` — explicit AUR packages

## Operations

- Restore: `scripts/system/opencode-restore.sh`
- Read-only check: `scripts/system/opencode-restore.sh --check`
- Audit: `~/Work/Zurnel/Reports/Dotfiles-System-Audit-2026-09-25.md`
