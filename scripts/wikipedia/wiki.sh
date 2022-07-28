#!/usr/bin/zsh

query_exec () {
    if ! tmux has-session -t='wiki speak'; then
        xfce4-terminal -e "tmux new -s 'wiki speak' -n 'request query' '~/.local/bin/wikit \
            $(python3 ~/Documents/Configs/dotfiles/scripts/wikipedia/query.py) \
            -a > ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt' && echo '[+] Query requested...'"
    else
        tmux neww -n 'request query' -t='wiki speak': '~/.local/bin/wikit \
            $(python3 ~/Documents/Configs/dotfiles/scripts/wikipedia/query.py) \
            -a > ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt && echo "[+] Query requested..."'
    fi
}

qe="$(query_exec)"

wiki_speak () {
    mpv \
        ~/Documents/Configs/dotfiles/scripts/wikipedia/interesting_wiki.mp3 \
        --speed=1.2

    if ! tmux has-session -t='wiki speak'; then
        xfce4-terminal -e "tmux new -s 'wiki speak' -n 'wiki speak' \
            '/usr/local/bin/gtts-cli \
            -f ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt | \
            mpv - -speed=1.1 \
            --force-seekable \
            --demuxer-seekable-cache=yes \
            --demuxer-max-bytes=2000MiB \
            --demuxer-readahead-secs=2000'"
    else
        tmux neww -n 'wiki speak' \
            -t='wiki speak': \
            '/usr/local/bin/gtts-cli \
            -f ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt | \
            mpv - -speed=1.1 \
            --force-seekable \
            --demuxer-seekable-cache=yes \
            --demuxer-max-bytes=2000MiB \
            --demuxer-readahead-secs=2000'
    fi
}

empty_query () {
    if ! tmux has-session -t='wiki speak'; then
        xfce4-terminal -e "tmux new -s 'wiki speak' -n 'empty query' 'vim ~/Documents/Configs/dotfiles/scripts/wikipedia/query.txt'"
    else
        tmux neww -n 'empty query' -t='wiki speak': 'vim ~/Documents/Configs/dotfiles/scripts/wikipedia/query.txt'
    fi
}

not_found () {
    until ! grep -q "Page not found" wiki.txt;
    do
        if ! tmux has-session -t='wiki speak'; then
            xfce4-terminal -e "tmux new -s 'wiki speak' -n 'page not found' echo '[+] Page not found, Requesting again...' '$qe'"
        else
            tmux neww -n 'page not found' \
            -t='wiki speak': \
            'echo "[+] Page not found, Requesting again..." \
            "$qe"'
        fi
    done
}

session () {
    query_exec
    wait $(pgrep wikit)
    wiki_speak
    if ! tmux has-session -t='wiki speak'; then
        xfce4-terminal -e "tmux new -s 'wiki speak' -n 'wiki text' \
            'less ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt'"
    else
        tmux neww -n 'Wiki text' \
            -t='wiki speak': \
            'less ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt'
    fi
}

main () {
    if [ ! -s query.txt ]; then
        empty_query
    fi

    if ! grep -q "Page not found" wiki.txt && [ -s wiki.txt ]; then
        session
    fi

    if grep -q "Page not found" wiki.txt || [ ! -s wiki.txt ]; then
        not_found
    fi
}

main
