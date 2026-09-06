#!/usr/bin/env bash
# Scripts for volume controls for audio and mic.
# v3 (2026-09-06): auto-detect any connected BT device. Previously hardcoded
# to Space One MAC; now follows whatever BT sink is the current PipeWire
# default. If the default sink is a BT device, volume keys control it.
# If not, picks the first available BT sink. Falls back to default sink
# (laptop speaker / HDMI) when no BT is connected.
#
# Removed easyeffects entirely — this script now uses wpctl directly.
# pamixer previously targeted easyeffects_sink (the virtual filter), so
# key presses nudged EE's gain but never moved the level reaching the
# speakers/sink HW volume.
#
# PipeWire has two ID systems:
#   - wpctl: numeric object id (e.g. 104)
#   - pactl: name string (e.g. "bluez_output.F4_9D_8A_1C_BE_F6.1")
# We resolve to BOTH via pw-dump and use the right one per command.

iDIR="$HOME/.config/swaync/icons"
sDIR="$HOME/.config/hypr/scripts"

# Short-lived cache of the resolved sink/mic. Key-hold repeats fire many times
# per second; without this every fire pays for a full pw-dump + python3
# pass (~100ms). Entries are revalidated with wpctl before reuse, so a
# Bluetooth reconnect / output switch is picked up on the next press.
_SINK_CACHE="${XDG_RUNTIME_DIR:-/tmp}/hypr-volume-sink.cache"
_MIC_CACHE="${XDG_RUNTIME_DIR:-/tmp}/hypr-volume-mic.cache"

# Resolve the audio sink to control. Auto-detect:
#   1. If the current PipeWire default sink IS a BT device → use it
#   2. Otherwise, pick the first connected BT sink (Space One or Liberty 4 NC)
#   3. Fall back to the current PipeWire default sink (laptop/HDMI)
# Sets globals _SINK_WPID (numeric) and _SINK_NAME (string).
# Resolve the mic to control. Auto-detect:
resolve_sink() {
    _SINK_WPID=
    _SINK_NAME=
    # Fast path: reuse a recently resolved sink (validated live below).
    if [[ -f "$_SINK_CACHE" ]] && (( $(date +%s) - $(stat -c %Y "$_SINK_CACHE" 2>/dev/null || echo 0) < 10 )); then
        # shellcheck disable=SC1090
        source "$_SINK_CACHE"
        if [[ -n "$_SINK_WPID" && -n "$_SINK_NAME" ]] && wpctl get-volume "$_SINK_WPID" >/dev/null 2>&1; then
            return 0
        fi
        _SINK_WPID=
        _SINK_NAME=
    fi
    # Single pw-dump pass: find default sink + any BT sinks
    eval "$(pw-dump 2>/dev/null | python3 -c "
import json, sys, subprocess
nodes = json.load(sys.stdin)
def_sink_id = None
bt_sinks = []
all_sinks = {}
for n in nodes:
    if n.get('type') != 'PipeWire:Interface:Node':
        continue
    p = n.get('info',{}).get('props',{})
    if p.get('media.class') != 'Audio/Sink':
        continue
    nid = n['id']
    name = p.get('node.name','')
    all_sinks[nid] = name
    if 'bluez_output' in name:
        bt_sinks.append(nid)

# Get current default sink from wpctl
try:
    r = subprocess.run(['wpctl','status'], capture_output=True, text=True, timeout=2)
    for line in r.stdout.splitlines():
        # Default sink line contains an asterisk (e.g. '  *   54. ...')
        if '*' in line and 'Sink' not in line and 'Source' not in line:
            # Extract the number after the asterisk and before the first dot
            import re
            match = re.search(r'\*\s*(\d+)', line)
            if match:
                def_sink_id = int(match.group(1))
                break
except: pass

# Priority 1: default sink IS a BT device
if def_sink_id and def_sink_id in bt_sinks:
    print('_SINK_WPID=' + repr(def_sink_id))
    print('_SINK_NAME=' + repr(all_sinks[def_sink_id]))
# Priority 2: any BT sink available
elif bt_sinks:
    print('_SINK_WPID=' + repr(bt_sinks[0]))
    print('_SINK_NAME=' + repr(all_sinks[bt_sinks[0]]))
# Priority 3: default sink (laptop/HDMI)
elif def_sink_id and def_sink_id in all_sinks:
    print('_SINK_WPID=' + repr(def_sink_id))
    print('_SINK_NAME=' + repr(all_sinks[def_sink_id]))
")"
    if [[ -n "$_SINK_WPID" && -n "$_SINK_NAME" ]]; then
        printf '_SINK_WPID=%q\n_SINK_NAME=%q\n' "$_SINK_WPID" "$_SINK_NAME" > "$_SINK_CACHE"
        return 0
    fi
    return 1
}
#   1. BT mic of the currently resolved BT sink (matched by device.id)
#   2. Any available BT mic
#   3. Default source
# Sets globals _MIC_WPID (numeric) and _MIC_NAME (string).
resolve_mic() {
    _MIC_WPID=
    _MIC_NAME=
    # Fast path: reuse a recently resolved mic.
    if [[ -f "$_MIC_CACHE" ]] && (( $(date +%s) - $(stat -c %Y "$_MIC_CACHE" 2>/dev/null || echo 0) < 10 )); then
        # shellcheck disable=SC1090
        source "$_MIC_CACHE"
        if [[ -n "$_MIC_WPID" && -n "$_MIC_NAME" ]] && wpctl get-volume "$_MIC_WPID" >/dev/null 2>&1; then
            return 0
        fi
        _MIC_WPID=
        _MIC_NAME=
    fi
    # Ensure we know which sink is active so we can pick its mic
    resolve_sink || true
    eval "$(pw-dump 2>/dev/null | python3 -c "
import json, sys, subprocess
nodes = json.load(sys.stdin)
sink_devid = ''
try:
    sink_id = ${_SINK_WPID:-0}
    for n in nodes:
        if n.get('id') == sink_id:
            sink_devid = n.get('info',{}).get('props',{}).get('device.id','')
            break
except: pass

bt_mic_matched = None
bt_mic_any = None
for n in nodes:
    p = n.get('info',{}).get('props',{})
    if p.get('media.class') == 'Audio/Source' and 'bluez_input' in p.get('node.name',''):
        if sink_devid and p.get('device.id','') == sink_devid:
            bt_mic_matched = (n['id'], p['node.name'])
            break
        if bt_mic_any is None:
            bt_mic_any = (n['id'], p['node.name'])

chosen = bt_mic_matched or bt_mic_any
if chosen:
    print('_MIC_WPID=' + repr(chosen[0]))
    print('_MIC_NAME=' + repr(chosen[1]))
else:
    # Fallback: default source
    try:
        r = subprocess.run(['wpctl','status'], capture_output=True, text=True, timeout=2)
        for line in r.stdout.splitlines():
            if '  * ' in line and 'Source' in line:
                parts = line.strip().split('.', 1)
                if parts[0].strip().isdigit():
                    for n in nodes:
                        if n.get('id') == int(parts[0].strip()):
                            print('_MIC_WPID=' + repr(int(parts[0].strip())))
                            print('_MIC_NAME=' + repr(n.get('info',{}).get('props',{}).get('node.name','')))
                            break
                    break
    except: pass
")"
    if [[ -n "$_MIC_WPID" && -n "$_MIC_NAME" ]]; then
        printf '_MIC_WPID=%q\n_MIC_NAME=%q\n' "$_MIC_WPID" "$_MIC_NAME" > "$_MIC_CACHE"
        return 0
    fi
    return 1
}

# Get Volume (0-100, "Muted" if muted)
get_volume() {
    resolve_sink || { echo "?"; return 1; }
    local raw
    raw=$(wpctl get-volume "$_SINK_WPID" 2>/dev/null)
    local vol pct
    vol=$(echo "$raw" | awk '{print $2}')
    pct=$(awk -v v="$vol" 'BEGIN{printf "%d", v*100}')
    if echo "$raw" | grep -q Muted; then
        echo "Muted"
    else
        echo "$pct %"
    fi
}

# Get icons
get_icon() {
    current=$(get_volume)
    if [[ "$current" == "Muted" ]]; then
        echo "$iDIR/volume-mute.png"
    elif [[ "${current%\%}" -le 30 ]]; then
        echo "$iDIR/volume-low.png"
    elif [[ "${current%\%}" -le 60 ]]; then
        echo "$iDIR/volume-mid.png"
    else
        echo "$iDIR/volume-high.png"
    fi
}

# Notify
notify_user() {
    if [[ "$(get_volume)" == "Muted" ]]; then
        echo "Muted" && notify-send -e -h string:x-canonical-private-synchronous:volume_notif -h boolean:SWAYNC_BYPASS_DND:true -u low -i "$(get_icon)" " Volume:" " Muted"
    else
        notify-send -e -h int:value:"$(get_volume | sed 's/%//')" -h string:x-canonical-private-synchronous:volume_notif -h boolean:SWAYNC_BYPASS_DND:true -u low -i "$(get_icon)" " Volume Level:" " $(get_volume)" &&
        "$sDIR/Sounds.sh" --volume
    fi
}

# Increase Volume (5% steps, cap at 150% to match the old pamixer behaviour)
inc_volume() {
    resolve_sink || return 1
    local raw vol cur
    raw=$(wpctl get-volume "$_SINK_WPID" 2>/dev/null)
    vol=$(echo "$raw" | awk '{print $2}')
    cur=$(awk -v v="$vol" 'BEGIN{printf "%.2f", v}')
    # clamp at 1.50
    if awk -v c="$cur" 'BEGIN{exit !(c+0.045 < 1.50)}'; then
        wpctl set-volume "$_SINK_WPID" 0.05+ >/dev/null 2>&1
    else
        wpctl set-volume "$_SINK_WPID" 1.50 >/dev/null 2>&1
    fi
    notify_user
}

# Decrease Volume
dec_volume() {
    resolve_sink || return 1
    wpctl set-volume "$_SINK_WPID" 0.05- >/dev/null 2>&1
    notify_user
}

# Toggle Mute (pactl needed for get-mute; wpctl 0.5.17 lacks it)
toggle_mute() {
	resolve_sink || return 1
	if [ "$(pactl get-sink-mute "$_SINK_NAME" 2>/dev/null | awk '{print $NF}')" == "no" ]; then
 pactl set-sink-mute "$_SINK_NAME" 1 >/dev/null 2>&1 && notify-send -e -u low -h boolean:SWAYNC_BYPASS_DND:true -i "$iDIR/volume-mute.png" " Mute:" " Switched OFF"
	else
 pactl set-sink-mute "$_SINK_NAME" 0 >/dev/null 2>&1 && notify-send -e -u low -h boolean:SWAYNC_BYPASS_DND:true -i "$iDIR/volume-high.png" " Mute:" " Switched ON"
	fi
}

# Toggle Mic (pactl needed for get-mute)
toggle_mic() {
	resolve_mic || return 1
	if [ "$(pactl get-source-mute "$_MIC_NAME" 2>/dev/null | awk '{print $NF}')" == "no" ]; then
 pactl set-source-mute "$_MIC_NAME" 1 >/dev/null 2>&1 && notify-send -e -u low -h boolean:SWAYNC_BYPASS_DND:true -i "$iDIR/microphone-mute.png" " Microphone:" " Switched OFF"
	else
 pactl set-source-mute "$_MIC_NAME" 0 >/dev/null 2>&1 && notify-send -e -u low -h boolean:SWAYNC_BYPASS_DND:true -i "$iDIR/microphone.png" " Microphone:" " Switched ON"
	fi
}

# Get Mic Icon
get_mic_icon() {
    current=$(get_mic_volume)
    if [[ "$current" == "Muted" ]]; then
        echo "$iDIR/microphone-mute.png"
    else
        echo "$iDIR/microphone.png"
    fi
}

# Get Microphone Volume (0-100, "Muted" if muted)
get_mic_volume() {
    resolve_mic || { echo "?"; return 1; }
    local raw vol pct
    raw=$(wpctl get-volume "$_MIC_WPID" 2>/dev/null)
    vol=$(echo "$raw" | awk '{print $2}')
    pct=$(awk -v v="$vol" 'BEGIN{printf "%d", v*100}')
    if echo "$raw" | grep -q Muted; then
        echo "Muted"
    else
        echo "$pct %"
    fi
}

# Notify for Microphone
notify_mic_user() {
    volume=$(get_mic_volume)
    icon=$(get_mic_icon)
    notify-send -e -h int:value:"$volume" -h "string:x-canonical-private-synchronous:volume_notif" -h boolean:SWAYNC_BYPASS_DND:true -u low -i "$icon" " Mic Level:" " $volume"
}

# Increase MIC Volume
inc_mic_volume() {
    resolve_mic || return 1
    wpctl set-volume "$_MIC_WPID" 0.05+ >/dev/null 2>&1
    notify_mic_user
}

# Decrease MIC Volume
dec_mic_volume() {
    resolve_mic || return 1
    wpctl set-volume "$_MIC_WPID" 0.05- >/dev/null 2>&1
    notify_mic_user
}

# Execute accordingly
if [[ "$1" == "--get" ]]; then
	get_volume
elif [[ "$1" == "--inc" ]]; then
	inc_volume
elif [[ "$1" == "--dec" ]]; then
	dec_volume
elif [[ "$1" == "--toggle" ]]; then
	toggle_mute
elif [[ "$1" == "--toggle-mic" ]]; then
	toggle_mic
elif [[ "$1" == "--get-icon" ]]; then
	get_icon
elif [[ "$1" == "--get-mic-icon" ]]; then
	get_mic_icon
elif [[ "$1" == "--mic-inc" ]]; then
	inc_mic_volume
elif [[ "$1" == "--mic-dec" ]]; then
	dec_mic_volume
else
	get_volume
fi
