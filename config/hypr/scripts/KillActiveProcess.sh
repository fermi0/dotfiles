#!/usr/bin/env bash

# Copied from Discord post. Thanks to @Zorg


# Get id and address of active window (Hyprland 0.56+ lua)
active_pid=$(hyprctl activewindow -j | jq -r '.pid // empty')
active_addr=$(hyprctl activewindow -j | jq -r '.address // empty')

# Try Hyprland dispatch first (most reliable for any window, including special)
if [ -n "$active_addr" ] && [ "$active_addr" != "null" ]; then
    hyprctl dispatch killactive 2>/dev/null || hyprctl dispatch closewindow address:$active_addr 2>/dev/null || true
fi
# Fallback: kill PID with SIGTERM then SIGKILL
if [ -n "$active_pid" ] && [ "$active_pid" != "null" ] && kill -0 "$active_pid" 2>/dev/null; then
    kill "$active_pid" 2>/dev/null || true
    sleep 0.2
    kill -9 "$active_pid" 2>/dev/null || true
fi
# Final fallback via lua if Hyprland still has the window
if [ -n "$active_addr" ] && [ "$active_addr" != "null" ]; then
    hyprctl eval "hl.dispatch(hl.dsp.window.close({window=\"address:$active_addr\"}))" 2>/dev/null || hyprctl eval "hl.dispatch(hl.dsp.window.kill({window=\"address:$active_addr\"}))" 2>/dev/null || true
fi