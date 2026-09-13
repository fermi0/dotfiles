# dotfiles

## What this is

A living system of configuration, scripts, and AI-agent tooling — versioned, symlinked, and battle-tested on a Legion 5 (Ultra 9 275HX / RTX 5060) running EndeavourOS + Hyprland.

```
dotfiles/
├── config/              # ~/.config/ — 40+ app configs (opencode, hypr, kitty, pipewire, nvim…)
├── scripts/             # ~/scripts/ — system, llama, news utilities
├── agents/              # ~/.agents/ — opencode skills (linux-poweruser, lemma, browser-control…)
├── os/                  # Pacman/AUR/Flatpak manifests for full system restore
├── data/                # Schema + seed only (runtime DBs gitignored)
├── meta/                # AGENTS.md, ecosystem map, vault index
└── README.md            # ← you are here
```

---

## The stack

| Layer | Tools |
|-------|-------|
| **AI Agent Runtime** | OpenCode (plugins: token-optimizer, poorguy-ratelimit, scheduler, sentinel, subtask2, handoff, notify-essentials) |
| **Local Models** | `ling-3.0-flash-fin-free` @ llama-server:1234 · `mxbai-embed-large` @ Ollama |
| **Browser Automation** | Playwright MCP — e2e tests, scraping, QA |
| **Vault / Second Brain** | Obsidian — 4-stage flow: Inbox → Daily → Projects → Archive |
| **Planning** | Evidence-based daily system: ultradian 90/20, implementation intentions (Gollwitzer d=0.65), spaced repetition (Dunlosky d=0.62) |
| **Linux Desktop** | Hyprland (lua), PipeWire/WirePlumber, kitty GPU-accelerated, btop, cava, lf |
| **Editor** | Neovim (lazy.nvim), Helix |
| **Shell** | zsh, starship, fzf, zoxide, atuin |

---

## Quick start (steal this)

The repo is location- and username-agnostic: clone it anywhere, then run the restore script.
It symlinks configs into place (no stow), rewrites hardcoded paths, installs plugin deps, and
recreates the scheduler jobs + systemd timers.

```bash
# 1. Clone anywhere (any username, any path)
git clone git@github.com:fermi0/dotfiles.git ~/dotfiles

# 2. Restore the OpenCode stack (preview first, then apply)
~/dotfiles/scripts/system/opencode-restore.sh --dry-run
~/dotfiles/scripts/system/opencode-restore.sh

# 3. Secrets: the script copies *.example templates — fill in your keys
#    ~/.env.local                                   (provider API keys)
#    ~/.config/opencode/opencode-poorguy-ratelimit.jsonc  (rotation keys)

# 4. Full-system packages (optional — the whole desktop, not just opencode)
sudo pacman -S --needed - < ~/dotfiles/os/pacman.txt
yay -S --needed - < ~/dotfiles/os/aur.txt
```

The restore script prints the remaining manual steps (opencode binary, `opencode auth login`,
searxng/llama.cpp apps, Obsidian REST cert, playwright browsers, global npm CLIs).

---

## Key entry points

| Want to… | Start here |
|----------|------------|
| Understand the agent system | `meta/AGENTS.md` |
| See the vault structure | `~/Work/Zurnel/_index.md` |
| Debug Linux audio | `config/pipewire/TROUBLESHOOTING.md` |
| Add a new opencode skill | `~/.config/opencode/skill/` |

---

## Philosophy

> **"Motivation is fleeting. Systems are reliable."** — James Clear

This repo *is* the system. The code, the configs, the agents — they're not documentation of what I did. They're the infrastructure that lets me do it again tomorrow, better.

---

## License

MIT — steal freely, attribute if you feel like it.
