#! /bin/bash

inotifywait -m /media/oppenheimer/zournal/Zournal -r -e modify,create,delete,delete_self,move,move_self |
    while read directory action file; do
        rsync -ausxhPlvW --inplace --size-only --stats /media/oppenheimer/zournal/Zournal/* /home/oppenheimer/Documents/ARCHIVES_of_KNOWLEDGE/Journalorigin/zournal/
    done
