#!/usr/bin/env bash
# WaybarCava.sh — safer single-instance handling, cleanup, and robustness
# Concept derived from an upstream community project; this variant focuses on lifecycle hardening.

set -euo pipefail

# Ensure cava exists
if ! command -v cava >/dev/null 2>&1; then
  echo "cava not found in PATH" >&2
  exit 1
fi

# 0..7 → ▁▂▃▄▅▆▇█
bar="▁▂▃▄▅▆▇█"
dict="s/;//g"
bar_length=${#bar}
for ((i = 0; i < bar_length; i++)); do
  dict+=";s/$i/${bar:$i:1}/g"
done

# Single-instance guard (only kill our previous instance if it's still alive)
RUNTIME_DIR="${XDG_RUNTIME_DIR:-/tmp}"
pidfile="$RUNTIME_DIR/waybar-cava.pid"
if [[ -f "$pidfile" ]]; then
  oldpid="$(cat "$pidfile" || true)"
  if [[ -n "$oldpid" ]] && kill -0 "$oldpid" 2>/dev/null; then
    pkill -P "$oldpid" 2>/dev/null || true # its cava + sed
    kill "$oldpid" 2>/dev/null || true
    sleep 0.1 || true
  fi
fi
# Reap any cava orphaned by an earlier waybar that was killed uncleanly, so
# they cannot pile up one PulseAudio stream per waybar restart.
pkill -f "cava -p ${RUNTIME_DIR}/waybar-cava\." 2>/dev/null || true
sleep 0.1 || true
printf '%d' $$ >"$pidfile"

# Unique temp config + cleanup on exit
config_file="$(mktemp "$RUNTIME_DIR/waybar-cava.XXXXXX.conf")"
# cava and sed are children of this script. Removing only the script's own
# files leaves them running, which is how stray cavas accumulated over time.
cleanup() {
	pkill -P $$ 2>/dev/null || true
	rm -f "$config_file" "$pidfile"
}
trap cleanup EXIT INT TERM

cat >"$config_file" <<EOF
[general]
framerate = 30
bars = 10

[input]
method = pulse
source = auto

[output]
method = raw
raw_target = /dev/stdout
data_format = ascii
ascii_max_range = 7
EOF

# Stream cava output and translate digits 0..7 to bar glyphs
exec cava -p "$config_file" | sed -u "$dict"
