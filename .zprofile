if [ -x "$(command -v tmux)" ] && [ -n "${DISPLAY}" ] && [ -z "${TMUX}" ]; then
        tmux attach || tmux >/dev/null 2>&1
fi

# source $HOME/.zshrc
clear
