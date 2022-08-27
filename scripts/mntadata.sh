#!/bin/zsh

for i in {b..z};
    do
        if [ -e "/dev/sd${i}1" ]; then
            echo "Mounting /dev/sd${i}1"
            sudo mount "/dev/sd${i}1" "/media/oppenheimer/adata"
            echo "/media/oppenheimer/adata mounted!"
            sleep 3;
            break
        else
            echo "/dev/sd${i}1 does not exist! Retrying..."
            sleep 1;
        fi
    done

