#!/usr/bin/env bash
# Script for changing blurs on the fly

notif="$HOME/.config/swaync/images"

STATE=$(hyprctl -j getoption decoration:blur:passes | jq ".int")

# 0.56+: `hyprctl keyword` is dead - it answers
# "keyword can't work with non-legacy parsers. Use eval." and changes nothing,
# so this script used to only pop a notification. Set the options through lua:
#   hl.config({decoration={blur={size=N, passes=M}}})
if [ "${STATE}" == "2" ]; then
	hyprctl eval "hl.config({decoration={blur={size=2, passes=1}}})" 2>/dev/null
 	notify-send -e -u low -i "$notif/note.png" " Less Blur"
else
	hyprctl eval "hl.config({decoration={blur={size=5, passes=2}}})" 2>/dev/null
  	notify-send -e -u low -i "$notif/ja.png" " Normal Blur"
fi
