# dotfiles

> **Reproducible Linux desktop + AI-augmented development environment. Evidence-based. No pseudoscience.**

---

## What this is

A living system of configuration, scripts, and AI-agent tooling — versioned, symlinked, and battle-tested on a Legion 5 (Ultra 9 275HX / RTX 5060) running EndeavourOS + Hyprland.

```
dotfiles/
├── config/              # ~/.config/ — 40+ app configs (opencode, hypr, kitty, pipewire, nvim…)
├── scripts/             # ~/scripts/ — system, daily planning utilities
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
| **AI Agent Runtime** | OpenCode (15 plugins: swarm, sentinel, lemma memory, poorguy-ratelimit, token-optimizer, handoff…) |
| **Local Models** | `ling-3.0-flash-fin-free` @ llama-server:1234 · `mxbai-embed-large` @ Ollama |
| **Browser Automation** | Playwright MCP — e2e tests, scraping, QA |
| **Vault / Second Brain** | Obsidian — 4-stage flow: Inbox → Daily → Projects → Archive |
| **Planning** | Evidence-based daily system: ultradian 90/20, implementation intentions (Gollwitzer d=0.65), spaced repetition (Dunlosky d=0.62) |
| **Linux Desktop** | Hyprland (lua), PipeWire/WirePlumber, kitty GPU-accelerated, btop, cava, lf |
| **Editor** | Neovim (lazy.nvim), Helix |
| **Shell** | zsh, starship, fzf, zoxide, atuin |

---

## Quick start (steal this)

```bash
# Clone to shared location (not ~)
git clone git@github.com:fermi0/dotfiles.git /home/shared/dotfiles

# Symlink the config tree
stow -d /home/shared/dotfiles -t ~/.config config

# Symlink scripts
ln -s /home/shared/dotfiles/scripts ~/scripts

# Symlink agents
ln -s /home/shared/dotfiles/agents ~/.agents

# Restore packages
sudo pacman -S --needed - < /home/shared/dotfiles/os/pacman.txt
yay -S --needed - < /home/shared/dotfiles/os/aur.txt

# OpenCode: install plugins + MCP servers
cd ~/.config/opencode && npm ci
opencode plugin install
opencode mcp add searxng http://localhost:8080
opencode mcp add playwright npx @playwright/mcp@latest
opencode mcp add lemma npx @lemma/mcp@latest
```

---

## Key entry points

| Want to… | Start here |
|----------|------------|
| Understand the agent system | `meta/AGENTS.md` |
| See the vault structure | `~/Work/Zurnel/_index.md` |
| Run daily planning | `scripts/daily/generate_daily.py` |
| Debug Linux audio | `config/pipewire/TROUBLESHOOTING.md` |
| Add a new opencode skill | `~/.config/opencode/skill/` |

---

## Philosophy

> **"Motivation is fleeting. Systems are reliable."** — James Clear

This repo *is* the system. The code, the configs, the agents — they're not documentation of what I did. They're the infrastructure that lets me do it again tomorrow, better.

---

## License

MIT — steal freely, attribute if you feel like it.