---
created: 2026-08-31
modified: 2026-08-31
type: package-index
status: post-stage8
---

# `config/` — hand-edited configs from `~/.config/`

Each subdirectory here is a **copy** (not a symlink yet) of a package's config
from `/home/work/.config/<pkg>/`. The original source still lives at the
home dir; this copy is the version-controlled, git-tracked reference.

## What this directory is for

- **Git is the source of truth** for these configs
- Each package's files are copied verbatim from `~/.config/`
- Auto-mutating state (caches, sqlite DBs, logs, runtime data) is gitignored
- When the symlink stage happens (stage 9), each subdirectory here will be
  symlinked to the corresponding location in `~/.config/`

## Per-package overview

| Package | Source | Notes |
|---|---|---|
| `opencode/` | `~/.config/opencode/` | opencode.jsonc + AGENTS.md + plugins + skill + commands |
| `hypr/` | `~/.config/hypr/` | JaKooLit Hyprland config (lua + backups ignored) |
| `kitty/` | `~/.config/kitty/` | terminal emulator config |
| `waybar/` | `~/.config/waybar/` | top bar config |
| `rofi/` | `~/.config/rofi/` | app launcher config |
| `wallust/` | `~/.config/wallust/` | theme generator config |
| `swaync/` | `~/.config/swaync/` | notification center |
| `wlogout/` | `~/.config/wlogout/` | logout menu |
| `quickshell/` | `~/.config/quickshell/` | shell config (minimal) |
| `yazi/` | `~/.config/yazi/` | terminal file manager |
| `lf/` | `~/.config/lf/` | alternative file manager |
| `nvim/` | `~/.config/nvim/` | Neovim (init.lua + lazy-lock.json; .git stripped) |
| `btop/` | `~/.config/btop/` | system monitor |
| `cava/` | `~/.config/cava/` | audio visualizer |
| `fastfetch/` | `~/.config/fastfetch/` | system info display |
| `sheldon/` | `~/.config/sheldon/` | zsh plugin manager state |
| `swarm-tools/` | `~/.config/swarm-tools/` | swarm MCP config (DB gitignored) |
| `openspec/` | `~/.config/openspec/` | openspec config |
| `systemd/` | `~/.config/systemd/user/` | user systemd units (1 daily-reflection pair + system services) |
| `autostart/` | `~/.config/autostart/` | XDG autostart .desktop files (currently empty) |

## Files at the top level of config/

- `starship.toml` — shell prompt
- `user-dirs.dirs` — XDG user dirs (Documents, Downloads, etc.)
- `user-dirs.locale` — XDG locale
- `mimeapps.list` — default apps per mime type
- `.gitignore` — patterns for what NOT to track

## What is NOT here

- **`obsidian/`** — the obsidian app's config IS its browser cache (895 MB).
  The real obsidian vault config is in `~/Work/Zurnel/.obsidian/`, tracked in
  the vault repo.
- **Auto-mutating app data** (Discord, Spotify, etc.) — gitignored
- **Browser profiles** (chromium, etc.) — not in this repo
- **DB files** — live in `/home/shared/data/` via symlinks (stages 4 + 5)

## Symlink plan (stage 9)

For each package above, the symlink will be:

```bash
rm -rf ~/.config/<pkg>
ln -s /home/shared/dotfiles/config/<pkg> ~/.config/<pkg>
```

(After stage 9, this directory becomes the single source of truth for
the work account's config.)

## See also

- `~/Work/Zurnel/Reports/Mind-Palace-Survey-2026-08-31.md` — the survey
  that identified which configs to track
- `~/Work/Zurnel/Reports/Mind-Palace-Dryrun-2026-08-31.md` — the plan
- Repo root `README.md` — migration history
