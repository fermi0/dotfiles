#!/usr/bin/bash
files=(~/Pictures/walls/*)
filesVGA=(~/Pictures/walls/*)
WALLPAPER=$(printf "%s\n" "${files[RANDOM % ${#files[@]}]}")
WALLPAPERVGA=$(printf "%s\n" "${filesVGA[RANDOM % ${#filesVGA[@]}]}")
feh -B white --bg-fill $WALLPAPER --bg-fill $WALLPAPERVGA
