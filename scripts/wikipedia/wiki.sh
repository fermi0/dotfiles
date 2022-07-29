#!/usr/bin/zsh

query_exec () {
    ~/.local/bin/wikit \
        $(python3 ~/Documents/Configs/dotfiles/scripts/wikipedia/query.py) \
        -a > ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt \
        2> /dev/null
    echo "[+] Query requested..."
}

wiki_speak () {
    if ! grep -q "Page not found" wiki.txt && [ -s wiki.txt ]; then 
        mpv \
            ~/Documents/Configs/dotfiles/scripts/wikipedia/interesting_wiki.mp3 \
            --speed=1.2
    else
        tmux select-window \
            -t='empty query' \
            2> /dev/null
    fi

    if [ -s wiki.txt ]; then
        /usr/local/bin/gtts-cli \
            -f ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt | \
            mpv - -speed=1.1 \
            --force-seekable \
            --demuxer-seekable-cache=yes \
            --demuxer-max-bytes=2000MiB \
            --demuxer-readahead-secs=2000 \
            2> /dev/null
    else
        tmux kill-window -t 'wiki text'
        not_found
    fi
}

empty_query () {
    if [ ! -s query.txt ]; then
        tmux neww -n 'empty query' \
            -t='wiki speak': \
            vim ~/Documents/Configs/dotfiles/scripts/wikipedia/query.txt
    fi

    tail \
        --pid=$(pgrep -a "vim" | grep "query" | cut -d " " -f1) \
        -f /dev/null \
        2> /dev/null
}

session () {
    query_exec
    tail \
        --pid=$(pgrep wikit) \
        -f /dev/null \
        2> /dev/null

    sleep 3 && \
        tmux neww -n 'wiki text' \
        -t='wiki speak': \
        less ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt&

    tmux select-window -t='wiki'
    wiki_speak
}

not_found () {
    # pnf=0
    until ! grep -q "Page not found" wiki.txt && [ -s wiki.txt ]; # || [ $pnf -le 6 ];
    do
        empty_query
        echo "[-] Page not found, Requesting again..."
        query_exec
        # $(( pnf++ ))
    done
    # if [ $pnf -eq 6 ]; then
    #     empty_query 
    #     not_found
    # fi

    tail \
        --pid=$(pgrep wikit) \
        -f /dev/null \
        2> /dev/null

    sleep 3 && \
        tmux neww -n 'wiki text' \
        -t='wiki speak': \
        less ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt&

    tmux select-window -t='wiki'
    wiki_speak
}

main () {
    empty_query
    session
    # if grep -q "Page not found" wiki.txt || [ ! -s wiki.txt ]; then
    #     tmux kill-window -t 'wiki text'
    #     not_found
    # fi
}

main
