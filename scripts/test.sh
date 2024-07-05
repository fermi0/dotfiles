#!/bin/zsh
i=1
for j in "$fx"; do
    ck_pane="$(tmux list-panes | awk -F" " '{ print $1 }')"
    
    if [ $ck_pane != "2:" ]; then
        # echo "nopanes = $ck_pane"
        # tmux split-window -h \;
        tmux split-window -h "batcat $j"
    # fi
    else
    # if [ "$ck_pane" = "2:" ]; then
        # echo "panes = $ck_pane"
        tmux send-keys -t $i "batcat $j"
        ((i++))
    fi
done

