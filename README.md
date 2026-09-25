# dotfiles

## What this is

A living system of configuration, scripts, and AI-agent tooling for the `work` account on EndeavourOS + Hyprland.

```text
dotfiles/
├── config/       # versioned desktop, audio, shell, and OpenCode configuration
├── scripts/      # system, audio, llama, news, fzf, and Yazi utilities
├── agents/       # ~/.agents skills
├── os/           # Pacman and AUR package manifests
├── .aliasrc      # ~/.aliasrc
├── .zshrc        # ~/.zshrc
└── README.md
```

## Stack

| Layer | Tools |
|---|---|
| AI runtime | OpenCode, token-optimizer, poorguy-ratelimit, auto-free, scheduler, sentinel, subtask2, handoff |
| Local model | Ornith 1.5 35B-A3B through llama-server |
| Desktop | Hyprland, Waybar, Kitty, Rofi, SwayNC, Quickshell |
| Audio | PipeWire, WirePlumber, LDAC HQ, per-device EQ, OpenSCQ30 automation |
| Files | Neovim, Yazi, lf |
| Shell | zsh, Starship, fzf, Sheldon |
| Vault | Obsidian at `~/Work/Zurnel` |

## Restore

The restore script derives all managed paths from the clone location and `$HOME`. It does not rewrite tracked files.

```bash
git clone git@github.com:fermi0/dotfiles.git ~/dotfiles
~/dotfiles/scripts/system/opencode-restore.sh --check
~/dotfiles/scripts/system/opencode-restore.sh --dry-run
~/dotfiles/scripts/system/opencode-restore.sh
```

Modes:

- `--check`: read-only validation of links, secrets, dependencies, scheduler, and units
- `--dry-run`: show every link, backup, dependency, scheduler, and activation action
- `--links-only`: apply links and user-systemd wiring without reinstalling dependencies
- no flag: full restore, including dependencies and scheduler generation

The script creates collision-safe backups under `~/.local/share/dotfiles-restore-backups/`.

Secrets are never stored in Git:

- `~/.env.local` for provider credentials
- `~/.config/opencode/opencode-poorguy-ratelimit.jsonc` for rotation keys

Optional package restore:

```bash
sudo pacman -S --needed - < ~/dotfiles/os/pacman.txt
yay -S --needed - < ~/dotfiles/os/aur.txt
```

Applications and credentials that still require manual setup are printed by the restore script.

## Key entry points

| Purpose | Path |
|---|---|
| Repository map | `_index.md` |
| Managed config map | `config/README.md` |
| Script map | `scripts/_index.md` |
| OpenCode config | `config/opencode/opencode.jsonc` |
| Audio troubleshooting | `config/wireplumber/TROUBLESHOOTING.md` |
| System audit | `~/Work/Zurnel/Reports/Dotfiles-System-Audit-2026-09-25.md` |
