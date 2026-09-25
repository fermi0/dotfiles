---
created: 2026-08-31
modified: 2026-09-25
type: package-index
status: active
---

# `config/` — managed configuration

This directory is the version-controlled source for the `work` account's hand-edited configuration.

## Deployment model

- Most package directories are symlinked from `~/.config/<package>` to `config/<package>`.
- `~/.zshrc`, `~/.aliasrc`, `~/scripts`, and `~/.agents` link to repository-level files.
- PipeWire and WirePlumber are parent-directory symlinks, so newly tracked audio files are deployed immediately.
- Zen keeps its profile-specific parent directory; `chrome/` and `prefs.js` link into this tree.
- `~/.config/systemd` is a real directory. Tracked unit files and drop-ins link here, while generated scheduler units remain local.

Verify the complete deployment with:

```bash
~/dotfiles/scripts/system/opencode-restore.sh --check
```

## Managed packages

| Package | Live location | Notes |
|---|---|---|
| `opencode/` | `~/.config/opencode` | Global config, plugins, skills, scheduler runtime |
| `oc-local/` | `~/.config/oc-local` | Isolated local-model config |
| `hypr/` | `~/.config/hypr` | Lua Hyprland configuration and scripts |
| `kitty/` | `~/.config/kitty` | Terminal configuration |
| `waybar/` | `~/.config/waybar` | Status bar |
| `rofi/` | `~/.config/rofi` | Launcher and themes |
| `wallust/` | `~/.config/wallust` | Dynamic theme generation |
| `swaync/` | `~/.config/swaync` | Notification center; launched by systemd |
| `wlogout/` | `~/.config/wlogout` | Logout menu |
| `quickshell/` | `~/.config/quickshell` | Shell components |
| `yazi/` | `~/.config/yazi` | File manager |
| `lf/` | `~/.config/lf` | Alternative file manager |
| `nvim/` | `~/.config/nvim` | Neovim and lazy.nvim |
| `btop/` | `~/.config/btop` | System monitor |
| `cava/` | `~/.config/cava` | Audio visualizer |
| `fastfetch/` | `~/.config/fastfetch` | System information |
| `sheldon/` | `~/.config/sheldon` | Plugin manager state |
| `swarm-tools/` | `~/.config/swarm-tools` | Swarm config; runtime DB ignored |
| `openspec/` | `~/.config/openspec` | OpenSpec configuration |
| `pipewire/` | `~/.config/pipewire` | Sample rates and quality |
| `wireplumber/` | `~/.config/wireplumber` | LDAC, EQ, and AUX routing |
| `zen/` | Zen profile links | Theme source plus ignored live preferences |

The old OpenSCQ30 boot launchers were removed after the connection-triggered systemd watchdog replaced them. `autostart/` remains empty.

## Top-level files

- `starship.toml`
- `user-dirs.dirs`
- `user-dirs.locale`
- `mimeapps.list`
- `.gitignore`

## Runtime and secrets

Ignored content includes dependencies, scheduler runs/jobs, plugin state, logs, browser preferences, databases, timestamped backups, and credential files. Scheduler definitions are tracked under `opencode/scheduler-templates/`; generated job state remains ignored.
