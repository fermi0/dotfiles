#!/usr/bin/env bash
# Show all Hyprland keybinds in a rofi menu.
# Output: one clean line per bind: "KEYBIND  ->  Description"
if pidof rofi > /dev/null; then
  pkill rofi
  exit 0
fi

python3 "$HOME/.config/hypr/scripts/keybinds_parse.py" \
  | rofi -dmenu -i -no-custom -config "$HOME/.config/rofi/config-keybinds.rasi" \
         -mesg "Hyprland Keybindings (all)"
