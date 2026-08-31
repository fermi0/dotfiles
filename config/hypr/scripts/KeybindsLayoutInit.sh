#!/usr/bin/env bash
# Initialize J/K keybinds so they always cycle windows globally (no layout-specific behavior)
# This avoids double-actions when layouts change.

set -euo pipefail

# Always reset and bind SUPER+J/K the same way on startup (lua: hl.bind / hl.unbind)
hyprctl eval 'hl.unbind("SUPER+J")' || true
hyprctl eval 'hl.unbind("SUPER+K")' || true

# Cycle windows globally: J = next, K = previous (lua: window.cycle_next)
hyprctl eval 'hl.bind("SUPER+J", hl.dsp.window.cycle_next())'
hyprctl eval 'hl.bind("SUPER+K", hl.dsp.window.cycle_next({prev=true}))'
