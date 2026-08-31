#!/usr/bin/env bash
# Smart move window into group - tries all directions
# Usage: SmartIntoGroup.sh [left|right|up|down|auto]
# If auto (default), tries all directions until one succeeds

DIR="${1:-auto}"

try_direction() {
    local dir="$1"
    hyprctl dispatch "hl.dsp.window.move({ into_or_create_group = '$dir' })" 2>/dev/null
    return $?
}

if [ "$DIR" = "auto" ]; then
    for d in left right up down; do
        if try_direction "$d"; then
            exit 0
        fi
    done
    exit 1
else
    try_direction "$DIR"
fi