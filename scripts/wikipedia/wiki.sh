#!/usr/bin/zsh

query_exec () {
    ~/.local/bin/wikit \
        $(python3 ~/Documents/Configs/dotfiles/scripts/wikipedia/query.py) \
        -a > ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt
    echo "[+] Query requested..."
}

wiki_speak () {
    if ! grep -q "Page not found" wiki.txt && [ -s wiki.txt ]; then 
        mpv \
            ~/Documents/Configs/dotfiles/scripts/wikipedia/interesting_wiki.mp3 \
            --speed=1.2
    fi

    /usr/local/bin/gtts-cli \
        -f ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt | \
        mpv - -speed=1.1 \
        --force-seekable \
        --demuxer-seekable-cache=yes \
        --demuxer-max-bytes=2000MiB \
        --demuxer-readahead-secs=2000
}

empty_query () {
    tmux neww -n 'empty query' -t='wiki speak': vim ~/Documents/Configs/dotfiles/scripts/wikipedia/query.txt
}

session () {
    query_exec
    wait $(pgrep wikit)
    sleep 3 && tmux neww -n 'wiki text' -t='wiki speak': less ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt&
    tmux select-window -t='wiki'
    wiki_speak
}

not_found () {
    until ! grep -q "Page not found" wiki.txt && [ -s wiki.txt ];
    do
        echo "[-] Page not found, Requesting again..."
        query_exec
    done

    wait $(pgrep wikit)
    sleep 3 && tmux neww -n 'wiki text' -t='wiki speak': less ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt&
    tmux select-window -t='wiki'
    wiki_speak
}

main () {
    if [ ! -s query.txt ]; then
        empty_query
        sleep 5
    fi
    session
    if grep -q "Page not found" wiki.txt || [ ! -s wiki.txt ]; then
        tmux kill-window -t 'wiki text'
        not_found
    fi
}

main
