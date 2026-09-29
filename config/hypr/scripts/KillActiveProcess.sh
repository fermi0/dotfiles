#!/usr/bin/env bash

# Copied from Discord post. Thanks to @Zorg


# Get id and address of active window (Hyprland 0.56+ lua)
active_pid=$(hyprctl activewindow -j | jq -r '.pid // empty')
active_addr=$(hyprctl activewindow -j | jq -r '.address // empty')

# Try Hyprland dispatch first (most reliable for any window, including special)
# 0.56+: legacy `hyprctl dispatch killactive` / `closewindow <addr>` are dead -
# hyprctl dispatch is now Lua-only and both forms die with a parse error, which
# silently pushed every run onto the PID fallback below. Use hl.dispatch instead.
if [ -n "$active_addr" ] && [ "$active_addr" != "null" ]; then
    hyprctl eval "hl.dispatch(hl.dsp.window.kill({window=\"address:$active_addr\"}))" 2>/dev/null || true
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