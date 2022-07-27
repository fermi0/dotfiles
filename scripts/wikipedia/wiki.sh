#!/usr/bin/zsh

query_exec () {
    tmux renamew -t 0 'request query'
    tmux send-keys -t 'request query' \
        '~/.local/bin/wikit \
        $(python3 ~/Documents/Configs/dotfiles/scripts/wikipedia/query.py) \
        -a > ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt' C-m
    echo "[+] Query requested..."
}

wiki_speak () {
    mpv \
        ~/Documents/Configs/dotfiles/scripts/wikipedia/interesting_wiki.mp3 \
        --speed=1.2
    sleep 3 && \
        tmux neww -n 'Wiki Speak' \
        -t='wiki speak': \
        '/usr/local/bin/gtts-cli \
        -f ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt | \
        mpv - -speed=1.1 \
        --force-seekable \
        --demuxer-seekable-cache=yes \
        --demuxer-max-bytes=2000MiB \
        --demuxer-readahead-secs=2000'
}

empty_query () {
    tmux renamew -t 0 'Empty query' && \
        tmux send-keys -t 'Empty query' \
        'vim ~/Documents/Configs/dotfiles/scripts/wikipedia/query.txt'
}

not_found () {
    until ! grep -q "Page not found" wiki.txt; do
        tmux neww -n 'page not found' \
             -t='wiki speak': \
             echo "[+] Page not found, Requesting again..."
        query_exec
    done
}

session () {
    query_exec
    wait $(pgrep wikit)
    sleep 3 && \
        tmux neww -n 'Wiki text' \
        -t='wiki speak': \
        'less ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt'
    wiki_speak
}

main () {
    if [ -s query.txt ]; then
        if ! tmux has-session -t='wiki speak'; then
            xfce4-terminal -e "tmux new -s 'wiki speak'"
            empty_query
        fi
    fi

    if ! grep -q "Page not found" wiki.txt && [ -s wiki.txt ]; then
        if ! tmux has-session -t='wiki speak'; then
            xfce4-terminal -e "tmux new -s 'wiki speak'"
            session
        fi
    fi

    if grep -q "Page not found" wiki.txt || [ -s wiki.txt ]; then
        if ! tmux has-session -t='wiki speak'; then
            xfce4-terminal -e "tmux new -s 'wiki speak'"
            not_found
        fi
    fi
}

main
