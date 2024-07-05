#!/bin/sh

case "$(file -Lb --mime-type -- "$1")" in
    image/*)
        chafa -f sixel -s "$2x$3" --animate true "$1"
        exit 1
        ;;
    *)
        cat "$1"
        ;;
esac

