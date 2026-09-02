# If you come from bash you might have to change your $PATH.
export PATH=$HOME/bin:/usr/local/bin:$PATH

# Initialize completion system
autoload -Uz compinit
compinit

# Load Sheldon
eval "$(sheldon source)"

# Load pay-respects
eval "$(pay-respects zsh --alias)"

# Load awesome-fzf
source $HOME/scripts/fzf/awesome-fzf.zsh

# Load fzf-tab-completion
source $HOME/scripts/fzf/zsh/fzf-zsh-completion.sh
# source $HOME/scripts/fzf/python/fzf_python_completion.py

# Load alias
source $HOME/.aliasrc

# Go paths
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin

# Check archlinux plugin commands here
# https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins/archlinux

# Display Pokemon-colorscripts
# Project page: https://gitlab.com/phoneybadger/pokemon-colorscripts#on-other-distros-and-macos
#pokemon-colorscripts --no-title -s -r #without fastfetch
pokemon-colorscripts --no-title -s -r | fastfetch -c $HOME/.config/fastfetch/config-pokemon.jsonc --logo-type file-raw --logo-height 10 --logo-width 5 --logo -

# fastfetch. Will be disabled if above colorscript was chosen to install
#fastfetch -c $HOME/.config/fastfetch/config-compact.jsonc

# Set-up icons for files/directories in terminal using eza (migrated from lsd 2026-08-22)
alias ls='eza --icons'
alias l='eza -l'
alias la='eza -a'
alias lla='eza -la'
alias lt='eza --tree'
alias tree='eza --tree'
alias zrc='nvim ~/.zshrc'

# FZF configuration with smart preview
export FZF_DEFAULT_OPTS="
  --preview-window='right:50%:hidden'
  --bind='ctrl-/:toggle-preview'
  --preview='$HOME/scripts/fzf-preview.sh {}'
"

# For fzf-tab-completion, only show preview for file paths
zstyle ':fzf-tab:*' fzf-preview '$HOME/scripts/fzf-preview.sh $realpath 2>/dev/null'
zstyle ':fzf-tab:*' fzf-flags --preview-window=right:50%:hidden --bind=ctrl-/:toggle-preview

# Set-up FZF key bindings (CTRL R for fuzzy history finder)
source <(fzf --zsh)

HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt appendhistory

# Yazi shell wrapper
function y() {
	local tmp="$(mktemp -t "yazi-cwd.XXXXXX")" cwd
	command yazi "$@" --cwd-file="$tmp"
	IFS= read -r -d '' cwd < "$tmp"
	[ "$cwd" != "$PWD" ] && [ -d "$cwd" ] && builtin cd -- "$cwd"
	rm -f -- "$tmp"
}

#LF Icons
export LF_ICONS="di=📁:\
fi=📃:\
tw=🤝:\
ow=📂:\
ln=⛓:\
or=❌:\
ex=🎯:\
*.txt=✍:\
*.mom=✍:\
*.me=✍:\
*.ms=✍:\
*.png=🖼:\
*.webp=🖼:\
*.ico=🖼:\
*.jpg=📸:\
*.jpe=📸:\
*.jpeg=📸:\
*.gif=🖼:\
*.svg=🗺:\
*.tif=🖼:\
*.tiff=🖼:\
*.xcf=🖌:\
*.html=🌎:\
*.xml=📰:\
*.gpg=🔒:\
*.css=🎨:\
*.pdf=📚:\
*.djvu=📚:\
*.epub=📚:\
*.csv=📓:\
*.xlsx=📓:\
*.tex=📜:\
*.md=📘:\
*.r=📊:\
*.R=📊:\
*.rmd=📊:\
*.Rmd=📊:\
*.m=📊:\
*.mp3=🎵:\
*.opus=🎵:\
*.ogg=🎵:\
*.m4a=🎵:\
*.flac=🎼:\
*.wav=🎼:\
*.mkv=🎥:\
*.mp4=🎥:\
*.webm=🎥:\
*.mpeg=🎥:\
*.avi=🎥:\
*.mov=🎥:\
*.mpg=🎥:\
*.wmv=🎥:\
*.m4b=🎥:\
*.flv=🎥:\
*.zip=📦:\
*.rar=📦:\
*.7z=📦:\
*.tar.gz=📦:\
*.z64=🎮:\
*.v64=🎮:\
*.n64=🎮:\
*.gba=🎮:\
*.nes=🎮:\
*.gdi=🎮:\
*.1=ℹ:\
*.nfo=ℹ:\
*.info=ℹ:\
*.log=📙:\
*.iso=📀:\
*.img=📀:\
*.bib=🎓:\
*.ged=👪:\
*.part=💔:\
*.torrent=🔽:\
*.jar=♨:\
*.java=♨:\
"
eval "$(fnm env --use-on-cd)"

export PATH="/home/work/.local/bin:$PATH"

# API keys (from ~/.env.local - chmod 600, gitignored)
[ -f "$HOME/.env.local" ] && source "$HOME/.env.local"
export PROJECT_BASE_PATH="/home/work/Work/Zurnel"

# bun completions
[ -s "/home/work/.bun/_bun" ] && source "/home/work/.bun/_bun"

# bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Trust Obsidian Local REST API self-signed cert (obsidian-rest MCP)
export NODE_EXTRA_CA_CERTS="/home/work/.local/share/opencode-certs/obsidian-rest.crt"

# starship prompt (Phase 4, 2026-08-22)
eval "$(starship init zsh)"
# direnv per-project env (Phase 4, 2026-08-22)
eval "$(direnv hook zsh)"



# CodeMode (ships in opencode >=1.18.16): one code-exec tool replaces all MCP tool
# schemas -> ~63k prompts drop to <10k everywhere. Re-verify flag after updates:
#   grep -c OPENCODE_EXPERIMENTAL_CODE_MODE /usr/bin/opencode
export OPENCODE_EXPERIMENTAL_CODE_MODE=1

# Swarm: lite/coordination model for the opencode-swarm-plugin compaction prompt.
# Verified free (no API key), fast, 1M ctx, returns clean tool calls.
export OPENCODE_LITE_MODEL="openrouter-free/nvidia/nemotron-3.5-lightning:free"
