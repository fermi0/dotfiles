#!/bin/bash

# Get current window title
current_title=$(hyprctl activewindow -j | jq -r '.title')

# Prompt for new title using rofi (or rofi if you prefer)
new_title=$(echo "$current_title" | rofi --dmenu --prompt "Rename window:")

# If user provided a title, rename the window
if [ -n "$new_title" ]; then
    window_address=$(hyprctl activewindow -j | jq -r '.address')
    hyprctl setprop address:$window_address title "$new_title"
fi
