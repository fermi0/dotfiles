#!/usr/bin/env bash
# Scripts for refreshing ags, waybar, rofi, swaync, wallust

SCRIPTSDIR=$HOME/.config/hypr/scripts
UserScripts=$HOME/.config/hypr/scripts

# Define file_exists function
file_exists() {
  if [ -e "$1" ]; then
    return 0 # File exists
  else
    return 1 # File does not exist
  fi
}

# Kill already running processes
# NOTE: waybar is deliberately absent. It is supervised by systemd
# (waybar.service, Restart=always); pkill'ing it here would only race
# systemd into restarting it.
_ps=(rofi ags)
for _prs in "${_ps[@]}"; do
  if pidof "${_prs}" >/dev/null; then
    pkill "${_prs}"
  fi
done

# quit ags & relaunch ags
#ags -q && ags &

# quit quickshell & relaunch quickshell
#pkill qs && qs &

# some process to kill
for pid in $(pidof rofi ags); do
  kill -SIGUSR1 "$pid"
  sleep 0.1
done

# Restart waybar through systemd so it stays supervised.
# This used to be a bare `waybar &`: an unsupervised background process that
# could die silently and leave no bar at all.
# SIGUSR2 (the old `killall -SIGUSR2 waybar` line) is NOT handled by waybar and
# terminates it, so it must never be used to "refresh" it.
systemctl --user restart waybar.service

systemctl --user restart swaync.service

# Relaunching rainbow borders if the script exists
sleep 1
if file_exists "${UserScripts}/RainbowBorders.sh"; then
  ${UserScripts}/RainbowBorders.sh &
fi

exit 0
