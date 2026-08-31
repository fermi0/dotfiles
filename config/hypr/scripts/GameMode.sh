#!/usr/bin/env bash
# Game Mode. Turning off all animations

notif="$HOME/.config/swaync/images/ja.png"
SCRIPTSDIR="$HOME/.config/hypr/scripts"


HYPRGAMEMODE=$(hyprctl -j getoption animations:enabled | jq -r '.int // .bool // empty')
# Handle both old (1/0) and new (true/false) bool formats after lua migration
if [ "$HYPRGAMEMODE" = "1" ] || [ "$HYPRGAMEMODE" = "true" ] ; then
    hyprctl eval 'hl.config({animations={enabled=false}})'
    hyprctl eval 'hl.config({decoration={shadow={enabled=false}}})'
    hyprctl eval 'hl.config({decoration={blur={enabled=false}}})'
    hyprctl eval 'hl.config({general={gaps_in=0, gaps_out=0, border_size=1}})'
    hyprctl eval 'hl.config({decoration={rounding=0}})'
	
	hyprctl eval 'hl.window_rule({match={class="^(.*)$"}, opacity="1 override 1 override 1 override"})'
    awww kill 
    notify-send -e -u low -i "$notif" " Gamemode:" " enabled"
    sleep 0.1
    exit
else
	awww-daemon --format xrgb && awww img "$HOME/.config/rofi/.current_wallpaper" &
	sleep 0.1
	${SCRIPTSDIR}/WallustSwww.sh
	sleep 0.5
  hyprctl reload
	${SCRIPTSDIR}/Refresh.sh	 
    notify-send -e -u normal -i "$notif" " Gamemode:" " disabled"
    exit
fi
hyprctl reload
