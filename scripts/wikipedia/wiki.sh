#!/usr/bin/bash

while true
do
    if [ ! -s query.txt ]; then
        xfce4-terminal -e "tmux new -s 'Empty query' 'vim /home/oppenheimer/Documents/Configs/dotfiles/scripts/wikipedia/query.txt'";
    fi

    if ! grep -q "Page not found" wiki.txt; then
        break
    fi

    if grep -q "Page not found" wiki.txt; then
        echo "[+] Page not found, Requesting again..."
        wikit $(python3 ~/Documents/Configs/dotfiles/scripts/wikipedia/query.py) -a > ~/Documents/Configs/dotfiles/scripts/wikipedia/wiki.txt;
    fi
done
