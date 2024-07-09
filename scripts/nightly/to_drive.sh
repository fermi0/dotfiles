#! /bin/bash

inotifywait -m /home/oppenheimer/Documents/ARCHIVES_of_KNOWLEDGE/Journalorigin/zournal -r -e modify,create,delete,delete_Self,move,move_self |
    while read directory action file; do
        rsync -ausxhPlvW --inplace --size-only --stats /home/oppenheimer/Documents/ARCHIVES_of_KNOWLEDGE/Journalorigin/zournal/* /media/oppenheimer/zournal/Zournal/
    done
