#!/usr/bin/env bash
# Wallust: derive colors from the current wallpaper and update templates
# Usage: WallustSwww.sh [absolute_path_to_wallpaper]

set -euo pipefail

# Inputs and paths
passed_path="${1:-}"
cache_dir="$HOME/.cache/awww/"
rofi_link="$HOME/.config/rofi/.current_wallpaper"
wallpaper_current="$HOME/.config/hypr/wallpaper_effects/.wallpaper_current"

# Helper: get focused monitor name (prefer JSON)
get_focused_monitor() {
  if command -v jq >/dev/null 2>&1; then
    hyprctl monitors -j | jq -r '.[] | select(.focused) | .name'
  else
    hyprctl monitors | awk '/^Monitor/{name=$2} /focused: yes/{print name}'
  fi
}

# Helper: read the wallpaper path currently displayed on a monitor, straight
# from the awww daemon.
#
# This must use `awww query -j`. The plain-text output is whitespace-delimited,
# so the previous `awk '{print $9}'` truncated the path at the first space and
# broke on every wallpaper whose filename contains one -- which silently exited
# and left the colour templates stale.
get_wallpaper_for_monitor() {
  local mon="$1"
  if command -v jq >/dev/null 2>&1; then
    # Shape is {"<namespace>": [{"name":..., "displaying": {"image": "..."}}]}
    awww query -j 2>/dev/null |
      jq -r --arg m "$mon" '.[].[] | select(.name == $m) | .displaying.image // empty'
  else
    # Fallback: strip the known literal prefix instead of counting fields, so
    # spaces in the path survive.
    awww query 2>/dev/null |
      grep -F "$mon" | sed -e 's/^.*currently displaying: image: //'
  fi
}

# Determine wallpaper_path
wallpaper_path=""
if [[ -n "$passed_path" && -f "$passed_path" ]]; then
  wallpaper_path="$passed_path"
else
  # Read current wallpaper for the focused monitor straight from the daemon
  current_monitor="$(get_focused_monitor)"
  wallpaper_path="$(get_wallpaper_for_monitor "$current_monitor")"
fi

if [[ -z "${wallpaper_path:-}" || ! -f "$wallpaper_path" ]]; then
  # Nothing to do; avoid failing loudly so callers can continue
  exit 0
fi

# Update helpers that depend on the path
ln -sf "$wallpaper_path" "$rofi_link" || true
mkdir -p "$(dirname "$wallpaper_current")"
cp -f "$wallpaper_path" "$wallpaper_current" || true

# Run wallust (silent) to regenerate templates defined in ~/.config/wallust/wallust.toml
# -s is used in this repo to keep things quiet and avoid extra prompts
wallust run -s "$wallpaper_path" || true
