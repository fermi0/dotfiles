#!/usr/bin/zsh

WIKI="/home/oppenheimer/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt"
QUERY="/home/oppenheimer/Documents/Configs/dotfiles/scripts/wikipedia/query.txt"
QUERY_LOG="/home/oppenheimer/Documents/Configs/dotfiles/scripts/wikipedia/log_query.txt"
# log_count=1

query_exec () {
    query=$(sed -n '1p' "$QUERY")
    ~/.local/bin/wikit \
        -a $(sed -n '1p' "$QUERY") > "$WIKI" 2> /dev/null
    echo "[+] Query requested..."
    sed -i '1d' "$QUERY"
    sed -i "\$a\ $query" "$QUERY_LOG"
    tail \
        --pid=$(pgrep wikit) \
        -f /dev/null \
        2> /dev/null
    # ~/.local/bin/wikit \
    #     $(python3 ~/Documents/Configs/dotfiles/scripts/wikipedia/query.py) \
    #     -a > "$WIKI" \
    #     2> /dev/null
    # echo "[+] Query requested..."
}

wiki_speak () {
    if ! grep -q "Page not found" "$WIKI" && [ -s "$WIKI" ]; then 
        mpv \
            ~/Documents/Configs/dotfiles/scripts/wikipedia/interesting_wiki.mp3 \
            --speed=1.2
    else
        tmux select-window \
            -t='empty query' \
            2> /dev/null
    fi
    if ! grep -q "Page not found" "$WIKI" && [ -s "$WIKI" ]; then
        /usr/local/bin/gtts-cli \
            -f "$WIKI" | \
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
    if [ ! -s "$QUERY" ]; then
        tmux neww -n 'empty query' \
            -t='wiki speak': \
            vim "$QUERY"
    fi
    tail \
        --pid=$(pgrep -a "vim" | grep "query" | cut -d " " -f1) \
        -f /dev/null&
    sleep 10m
    kill -9 $(pgrep -a "vim" | grep "query" | cut -d " " -f1) 2> /dev/null
}

session () {
    query_exec
    sleep 3 && \
        tmux neww -n 'wiki text' \
        -t='wiki speak': \
        less "$WIKI"&
    tmux select-window -t='wiki'
    wiki_speak
}

query_log () {
    line=$(wc -l "$QUERY_LOG" | cut -d " " -f1)
    rand=$(( $RANDOM % "$line" + 1 ))
    ~/.local/bin/wikit \
        -a $(sed -n "$rand p" "$QUERY_LOG") > "$WIKI"
    echo "[+] Query requested from log_query.txt..."
    # ((log_count=log_count+1))
    # sed -i "/^log_count/s/[0-9]/$log_count/" ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.sh
}

not_found () {
    # log_count=1
    # pnf=0
    until ! grep -q "Page not found" "$WIKI" && [ -s "$WIKI" ]; # || [ $pnf -le 6 ];
    do
        empty_query
        if [ ! -s "$QUERY" ]; then
            query_log
            break
        fi
        echo "[-] Page not found, Requesting again..."
        query_exec
        # $(( pnf++ ))
    done
    # if [ $pnf -eq 6 ]; then
    #     empty_query 
    #     not_found
    # fi
    until ! grep -q "Page not found" "$WIKI" && [ -s "$WIKI" ];
    do
        query_log
        echo "[-] Page not found, Requesting again..."
    done
    sleep 3 && \
        tmux neww -n 'wiki text' \
        -t='wiki speak': \
        less "$WIKI"&
    tmux select-window -t='wiki'
    wiki_speak
}

main () {
    empty_query
    session
    # if grep -q "Page not found" "$WIKI" || [ ! -s "$WIKI" ]; then
    #     tmux kill-window -t 'wiki text'
    #     not_found
    # fi
}

main
