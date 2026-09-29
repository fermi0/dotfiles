#!/usr/bin/env bash
# For disabling touchpad.
# Edit the Touchpad_Device on ~/.config/hypr/configs/Laptops.conf according to your system
# use hyprctl devices to get your system touchpad device name
# source https://github.com/hyprwm/Hyprland/discussions/4283?sort=new#discussioncomment-8648109

notif="$HOME/.config/swaync/images/ja.png"

export STATUS_FILE="$XDG_RUNTIME_DIR/touchpad.status"

# The device name must be injected by the caller. Laptops.lua used to define
# TOUCHPAD_ENABLED as a *Lua local*, so it never reached this script's
# environment and the old call became `hyprctl keyword '' true` - a no-op.
if [ -z "${TOUCHPAD_ENABLED:-}" ]; then
    notify-send -u low -i "$notif" " No touchpad configured" " (TOUCHPAD_ENABLED unset)"
    exit 1
fi

# 0.56+: `hyprctl keyword` is dead ("keyword can't work with non-legacy
# parsers. Use eval."), and the legacy `-r` refresh flag is gone with it.
# Runtime device toggle is hl.device({name=..., enabled=...}).
set_touchpad() {
    hyprctl eval "hl.device({name='$TOUCHPAD_ENABLED', enabled=$1})" 2>/dev/null
}

enable_touchpad() {
    printf "true" >"$STATUS_FILE"
    notify-send -u low -i $notif  " Enabling" " touchpad"
    set_touchpad true
}

disable_touchpad() {
    printf "false" >"$STATUS_FILE"
    notify-send -u low -i $notif " Disabling" " touchpad"
    set_touchpad false
}

if ! [ -f "$STATUS_FILE" ]; then
  enable_touchpad
else
  if [ $(cat "$STATUS_FILE") = "true" ]; then
    disable_touchpad
  elif [ $(cat "$STATUS_FILE") = "false" ]; then
    enable_touchpad
  fi
fi
