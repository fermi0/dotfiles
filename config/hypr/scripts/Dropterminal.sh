#!/usr/bin/env bash
#
# Made and brought to by Kiran George
# /* -- ✨ https://github.com/SherLock707 ✨ -- */  ##
# Dropdown Terminal
# Usage: ./Dropdown.sh [-d] <terminal_command>
# Example: ./Dropdown.sh foot
#          ./Dropdown.sh -d foot (with debug output)
#          ./Dropdown.sh "kitty -e zsh"
#          ./Dropdown.sh "alacritty --working-directory /home/user"

DEBUG=false
SPECIAL_WS="special:scratchpad"
ADDR_FILE="/tmp/dropdown_terminal_addr"
LOG_FILE="${XDG_RUNTIME_DIR:-/tmp}/hypr-dropdown.log"

# Truncate once per invocation so the log cannot grow without bound, and so it
# always describes the most recent toggle.
: >"$LOG_FILE" 2>/dev/null

# --- Hyprland 0.56+ lua compatibility (fixed 2026-08-26: silent moves + correct selectors) ---
#
# Every dispatch used to be piped to /dev/null, which threw away the only
# diagnostic Hyprland gives: warnings such as "=[C]:-1: Window is fullscreen".
# That is exactly why a dropdown stuck at ~fullscreen went undiagnosed - the log
# showed 20+ refusals that nobody could see. _hypr_run keeps the command quiet on
# success and records anything unexpected in $LOG_FILE.
_hypr_log() {
  printf '%s %s\n' "$(date '+%H:%M:%S')" "$1" >>"$LOG_FILE" 2>/dev/null
  debug_echo "$1"
}

# Runs a lua dispatch. Returns non-zero if Hyprland answered anything but "ok".
_hypr_run() {
  local dsp="$1" out rc=0
  out=$(hyprctl eval "$dsp" 2>&1) || rc=$?
  if [ -n "$out" ] && [ "$out" != "ok" ]; then
    _hypr_log "REJECTED: ${out//$'\n'/ } -- $dsp"
    return 1
  fi
  [ $rc -ne 0 ] && { _hypr_log "EXIT $rc -- $dsp"; return $rc; }
  return 0
}

_hypr_move_to_ws() { local ws="$1" addr="$2"; _hypr_run "hl.dispatch(hl.dsp.window.move({window=\"address:$addr\", workspace=\"$ws\", follow=false}))"; }
_hypr_pin() { local addr="$1"; _hypr_run "hl.dispatch(hl.dsp.window.pin({window=\"address:$addr\"}))"; }
_hypr_exec() { local cmd="$1"; esc=$(printf "%s" "$cmd" | sed "s/'/\\'/g"); _hypr_run "hl.dispatch(hl.dsp.exec_cmd('$esc'))"; }
_hypr_move_pixel() { local x="$1" y="$2" addr="$3"; _hypr_run "hl.dispatch(hl.dsp.window.move({window=\"address:$addr\", x=$x, y=$y}))"; }
_hypr_resize_pixel() { local w="$1" h="$2" addr="$3"; _hypr_run "hl.dispatch(hl.dsp.window.resize({window=\"address:$addr\", x=$w, y=$h}))"; }
_hypr_focus() { local addr="$1"; _hypr_run "hl.dispatch(hl.dsp.focus({window=\"address:$addr\"}))" || true; }

# Hyprland 0.56.2 bug: xdg-toplevel windows (kitty, Electron) are sometimes born
# in a bogus maximized/fullscreen state - hyprland.log shows
#   ERR: window kitty doesn't have FS handler assinged. This should never happen
# and then a configure for the full working area (2556x1567 on 2560x1600).
# In that state Hyprland REFUSES move/resize ("Window is fullscreen") and pin
# ("Window does not qualify to be pinned"), so every helper above silently
# no-ops and the dropdown stays stuck at ~fullscreen.
#
# The state clears with a *toggle* of mode="maximized" (action="unset" does NOT
# work). Guard it: only toggle when the window actually reports fullscreen, or we
# would maximize an otherwise healthy window.
_hypr_clear_bogus_fullscreen() {
  local addr="$1"
  local fs=$(hyprctl clients -j 2>/dev/null | jq -r --arg ADDR "$addr" '.[] | select(.address == $ADDR) | .fullscreen' 2>/dev/null)
  if [ "$fs" = "1" ]; then
    debug_echo "Clearing bogus fullscreen state on $addr"
    hyprctl eval "hl.dispatch(hl.dsp.window.fullscreen({window=\"address:$addr\", mode=\"maximized\"}))" >/dev/null 2>&1
    sleep 0.2
  fi
  return 0
}


# Dropdown size and position configuration (percentages)
WIDTH_PERCENT=65  # Width as percentage of screen width
HEIGHT_PERCENT=65 # Height as percentage of screen height
Y_PERCENT=10      # Y position as percentage from top (X is auto-centered)

# Animation settings
ANIMATION_DURATION=100 # milliseconds
SLIDE_STEPS=5
SLIDE_DELAY=5 # milliseconds between steps

# Parse arguments
if [ "$1" = "-d" ]; then
  DEBUG=true
  shift
fi

TERMINAL_CMD="$1"

# Debug echo function
debug_echo() {
  if [ "$DEBUG" = true ]; then
    echo "$@"
  fi
}

# Validate input
if [ -z "$TERMINAL_CMD" ]; then
  echo "Missing terminal command. Usage: $0 [-d] <terminal_command>"
  echo "Examples:"
  echo "  $0 foot"
  echo "  $0 -d foot (with debug output)"
  echo "  $0 'kitty -e zsh'"
  echo "  $0 'alacritty --working-directory /home/user'"
  echo ""
  echo "Edit the script to modify size and position:"
  echo "  WIDTH_PERCENT  - Width as percentage of screen (default: 50)"
  echo "  HEIGHT_PERCENT - Height as percentage of screen (default: 50)"
  echo "  Y_PERCENT      - Y position from top as percentage (default: 5)"
  echo "  Note: X position is automatically centered"
  exit 1
fi

# Function to get window geometry
get_window_geometry() {
  local addr="$1"
  hyprctl clients -j | jq -r --arg ADDR "$addr" '.[] | select(.address == $ADDR) | "\(.at[0]) \(.at[1]) \(.size[0]) \(.size[1])"'
}

# Function to animate window slide down (show)
animate_slide_down() {
  local addr="$1"
  local target_x="$2"
  local target_y="$3"
  local width="$4"
  local height="$5"

  debug_echo "Animating slide down for window $addr to position $target_x,$target_y"

  # Start position (above screen)
  local start_y=$((target_y - height - 50))

  # Calculate step size
  local step_y=$(((target_y - start_y) / SLIDE_STEPS))

  # Move window to start position instantly (off-screen)
  _hypr_move_pixel "$target_x" "$start_y" "$addr" >/dev/null 2>&1
  sleep 0.05

  # Animate slide down
  for i in $(seq 1 $SLIDE_STEPS); do
    local current_y=$((start_y + (step_y * i)))
    _hypr_move_pixel "$target_x" "$current_y" "$addr" >/dev/null 2>&1
    sleep 0.03
  done

  # Ensure final position is exact
  _hypr_move_pixel "$target_x" "$target_y" "$addr" >/dev/null 2>&1
}

# Function to animate window slide up (hide)
animate_slide_up() {
  local addr="$1"
  local start_x="$2"
  local start_y="$3"
  local width="$4"
  local height="$5"

  debug_echo "Animating slide up for window $addr from position $start_x,$start_y"

  # End position (above screen)
  local end_y=$((start_y - height - 50))

  # Calculate step size
  local step_y=$(((start_y - end_y) / SLIDE_STEPS))

  # Animate slide up
  for i in $(seq 1 $SLIDE_STEPS); do
    local current_y=$((start_y - (step_y * i)))
    _hypr_move_pixel "$start_x" "$current_y" "$addr" >/dev/null 2>&1
    sleep 0.03
  done

  debug_echo "Slide up animation completed"
}

# Function to get monitor info including scale and name of focused monitor
get_monitor_info() {
  local monitor_data=$(hyprctl monitors -j | jq -r '.[] | select(.focused == true) | "\(.x) \(.y) \(.width) \(.height) \(.scale) \(.name)"')
  if [ -z "$monitor_data" ] || [[ "$monitor_data" =~ ^null ]]; then
    debug_echo "Error: Could not get focused monitor information"
    return 1
  fi
  echo "$monitor_data"
}

# Function to calculate dropdown position with proper scaling and centering
calculate_dropdown_position() {
  local monitor_info=$(get_monitor_info)

  if [ $? -ne 0 ] || [ -z "$monitor_info" ]; then
    debug_echo "Error: Failed to get monitor info, using fallback values"
    echo "100 100 800 600 fallback-monitor"
    return 1
  fi

  local mon_x=$(echo $monitor_info | cut -d' ' -f1)
  local mon_y=$(echo $monitor_info | cut -d' ' -f2)
  local mon_width=$(echo $monitor_info | cut -d' ' -f3)
  local mon_height=$(echo $monitor_info | cut -d' ' -f4)
  local mon_scale=$(echo $monitor_info | cut -d' ' -f5)
  local mon_name=$(echo $monitor_info | cut -d' ' -f6)

  debug_echo "Monitor info: x=$mon_x, y=$mon_y, width=$mon_width, height=$mon_height, scale=$mon_scale"

  # NOTE: hyprctl reports LOGICAL pixels - it has already applied the monitor
  # scale and the reserved-area insets. Dividing by .scale again (as this
  # function used to) shrank the dropdown by ~1/scale on a scaled monitor, and
  # the non-bc fallback turned scale 1.5 into 15, a 10x error. No scale maths
  # is needed here at all; scale is only logged now.
  local logical_width="$mon_width"
  local logical_height="$mon_height"

  if ! [[ "$logical_width" =~ ^-?[0-9]+$ ]] || [ "$logical_width" -le 0 ]; then logical_width=1920; fi
  if ! [[ "$logical_height" =~ ^-?[0-9]+$ ]] || [ "$logical_height" -le 0 ]; then logical_height=1080; fi

  debug_echo "Monitor logical resolution: ${logical_width}x${logical_height} (scale=$mon_scale, already scaled)"

  # Calculate window dimensions based on LOGICAL space percentages
  local width=$((logical_width * WIDTH_PERCENT / 100))
  local height=$((logical_height * HEIGHT_PERCENT / 100))

  # Calculate Y position from top based on percentage of LOGICAL height
  local y_offset=$((logical_height * Y_PERCENT / 100))

  # Calculate centered X position in LOGICAL space
  local x_offset=$(((logical_width - width) / 2))

  # Apply monitor offset to get final positions in logical coordinates
  local final_x=$((mon_x + x_offset))
  local final_y=$((mon_y + y_offset))

  debug_echo "Window size: ${width}x${height} (logical pixels)"
  debug_echo "Final position: x=$final_x, y=$final_y (logical coordinates)"

  echo "$final_x $final_y $width $height $mon_name"
}

# Get the current workspace
CURRENT_WS=$(hyprctl activeworkspace -j | jq -r '.id')

# Function to get stored terminal address
get_terminal_address() {
  if [ -f "$ADDR_FILE" ] && [ -s "$ADDR_FILE" ]; then
    cut -d' ' -f1 "$ADDR_FILE"
  fi
}

# Function to get stored monitor name
get_terminal_monitor() {
  if [ -f "$ADDR_FILE" ] && [ -s "$ADDR_FILE" ]; then
    cut -d' ' -f2- "$ADDR_FILE"
  fi
}

# Function to check if terminal exists
terminal_exists() {
  local addr=$(get_terminal_address)
  if [ -n "$addr" ]; then
    hyprctl clients -j | jq -e --arg ADDR "$addr" 'any(.[]; .address == $ADDR)' >/dev/null 2>&1
  else
    return 1
  fi
}

# Function to check if terminal is in special workspace
terminal_in_special() {
  local addr=$(get_terminal_address)
  if [ -n "$addr" ]; then
    hyprctl clients -j | jq -e --arg ADDR "$addr" 'any(.[]; .address == $ADDR and .workspace.name == "special:scratchpad")' >/dev/null 2>&1
  else
    return 1
  fi
}

# Function to spawn terminal and capture its address
spawn_terminal() {
  debug_echo "Creating new dropdown terminal with command: $TERMINAL_CMD"

  # Calculate dropdown position for later use
  local pos_info=$(calculate_dropdown_position)
  if [ $? -ne 0 ]; then
    debug_echo "Warning: Using fallback positioning"
  fi

  local target_x=$(echo $pos_info | cut -d' ' -f1)
  local target_y=$(echo $pos_info | cut -d' ' -f2)
  local width=$(echo $pos_info | cut -d' ' -f3)
  local height=$(echo $pos_info | cut -d' ' -f4)
  local monitor_name=$(echo $pos_info | cut -d' ' -f5)

  debug_echo "Target position: ${target_x},${target_y}, size: ${width}x${height}"

  # Get window count before spawning
  local windows_before=$(hyprctl clients -j)
  local count_before=$(echo "$windows_before" | jq 'length')

  # Launch terminal directly in special workspace to avoid visible spawn
  _hypr_exec "[float; size $width $height; workspace special:scratchpad silent] $TERMINAL_CMD"

  # Wait for window to appear (lua mode needs more time)
  sleep 0.8

  # Get windows after spawning
  local windows_after=$(hyprctl clients -j)
  local count_after=$(echo "$windows_after" | jq 'length')

  local new_addr=""

  if [ "$count_after" -gt "$count_before" ]; then
    # Find the new window by comparing before/after lists
    new_addr=$(comm -13 \
      <(echo "$windows_before" | jq -r '.[].address' | sort) \
      <(echo "$windows_after" | jq -r '.[].address' | sort) |
      head -1)
  fi

  # Fallback: try to find by the most recently mapped window
  if [ -z "$new_addr" ] || [ "$new_addr" = "null" ]; then
    new_addr=$(hyprctl clients -j | jq -r 'sort_by(.focusHistoryID) | .[-1] | .address')
  fi

  if [ -n "$new_addr" ] && [ "$new_addr" != "null" ]; then
    # Store the address and monitor name
    echo "$new_addr $monitor_name" >"$ADDR_FILE"
    debug_echo "Terminal created with address: $new_addr in special workspace on monitor $monitor_name"

    # Small delay to ensure it's properly in special workspace
    sleep 0.2

    # Now bring it back with the same animation as subsequent shows
    # Use movetoworkspacesilent to avoid affecting workspace history
    _hypr_clear_bogus_fullscreen "$new_addr"
    _hypr_move_to_ws "$CURRENT_WS" "$new_addr"
    _hypr_pin "$new_addr"
    animate_slide_down "$new_addr" "$target_x" "$target_y" "$width" "$height"

    return 0
  fi

  debug_echo "Failed to get terminal address"
  return 1
}

# Main logic
if terminal_exists; then
  TERMINAL_ADDR=$(get_terminal_address)
  debug_echo "Found existing terminal: $TERMINAL_ADDR"
  focused_monitor=$(get_monitor_info | awk '{print $6}')
  dropdown_monitor=$(get_terminal_monitor)
  if [ "$focused_monitor" != "$dropdown_monitor" ]; then
    debug_echo "Monitor focus changed: moving dropdown to $focused_monitor"
    # Calculate new position for focused monitor
    pos_info=$(calculate_dropdown_position)
    target_x=$(echo $pos_info | cut -d' ' -f1)
    target_y=$(echo $pos_info | cut -d' ' -f2)
    width=$(echo $pos_info | cut -d' ' -f3)
    height=$(echo $pos_info | cut -d' ' -f4)
    monitor_name=$(echo $pos_info | cut -d' ' -f5)
    # Move and resize window
    _hypr_clear_bogus_fullscreen "$TERMINAL_ADDR"
    _hypr_move_pixel "$target_x" "$target_y" "$TERMINAL_ADDR"
    _hypr_resize_pixel "$width" "$height" "$TERMINAL_ADDR"
    # Update ADDR_FILE
    echo "$TERMINAL_ADDR $monitor_name" >"$ADDR_FILE"
  fi

  if terminal_in_special; then
    debug_echo "Bringing terminal from scratchpad with slide down animation"

    # Calculate target position
    pos_info=$(calculate_dropdown_position)
    target_x=$(echo $pos_info | cut -d' ' -f1)
    target_y=$(echo $pos_info | cut -d' ' -f2)
    width=$(echo $pos_info | cut -d' ' -f3)
    height=$(echo $pos_info | cut -d' ' -f4)

    # Use movetoworkspacesilent to avoid affecting workspace history
    _hypr_clear_bogus_fullscreen "$TERMINAL_ADDR"
    _hypr_move_to_ws "$CURRENT_WS" "$TERMINAL_ADDR"
    _hypr_pin "$TERMINAL_ADDR"

    # Set size and animate slide down
    _hypr_resize_pixel "$width" "$height" "$TERMINAL_ADDR"
    animate_slide_down "$TERMINAL_ADDR" "$target_x" "$target_y" "$width" "$height"

    _hypr_focus "$TERMINAL_ADDR"
  else
    debug_echo "Hiding terminal to scratchpad with slide up animation"

    # Get current geometry for animation
    geometry=$(get_window_geometry "$TERMINAL_ADDR")
    if [ -n "$geometry" ]; then
      curr_x=$(echo $geometry | cut -d' ' -f1)
      curr_y=$(echo $geometry | cut -d' ' -f2)
      curr_width=$(echo $geometry | cut -d' ' -f3)
      curr_height=$(echo $geometry | cut -d' ' -f4)

      debug_echo "Current geometry: ${curr_x},${curr_y} ${curr_width}x${curr_height}"

      # Animate slide up first
      animate_slide_up "$TERMINAL_ADDR" "$curr_x" "$curr_y" "$curr_width" "$curr_height"

      # Small delay then move to special workspace and unpin
      sleep 0.1
      _hypr_pin "$TERMINAL_ADDR"
      _hypr_move_to_ws "$SPECIAL_WS" "$TERMINAL_ADDR"
    else
      debug_echo "Could not get window geometry, moving to scratchpad without animation"
      _hypr_pin "$TERMINAL_ADDR"
      _hypr_move_to_ws "$SPECIAL_WS" "$TERMINAL_ADDR"
    fi
  fi
else
  debug_echo "No existing terminal found, creating new one"
  if spawn_terminal; then
    TERMINAL_ADDR=$(get_terminal_address)
    if [ -n "$TERMINAL_ADDR" ]; then
      _hypr_focus "$TERMINAL_ADDR"
    fi
  fi
fi
