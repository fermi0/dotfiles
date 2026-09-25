#!/usr/bin/env bash
# Script for Monitor backlights (if supported) using brightnessctl
# Dynamically detects the correct backlight device for iGPU/dGPU modes

iDIR="$HOME/.config/swaync/icons"
notification_timeout=1000
step=10  # INCREASE/DECREASE BY THIS VALUE

# Auto-detect the correct backlight device
# Priority: nvidia_0 (dGPU mode), intel_backlight (iGPU mode)
detect_backlight_device() {
    if [[ -e /sys/class/backlight/nvidia_0 ]]; then
        echo "nvidia_0"
    elif [[ -e /sys/class/backlight/intel_backlight ]]; then
        echo "intel_backlight"
    else
        # Fallback: use first available backlight device
        local dev=$(ls /sys/class/backlight/ 2>/dev/null | head -1)
        echo "${dev:-intel_backlight}"
    fi
}

device=$(detect_backlight_device)

# Get current brightness as an integer (without %)
get_brightness() {
    brightnessctl -m -d "$device" | cut -d, -f4 | tr -d '%'
}

# Determine the icon based on brightness level
get_icon_path() {
    local brightness=$1
    local level=$(( (brightness + 19) / 20 * 20 ))  # Round up to next 20
    if (( level > 100 )); then
        level=100
    fi
    echo "$iDIR/brightness-${level}.png"
}

# Send notification
send_notification() {
    local brightness=$1
    local icon_path=$2

    notify-send -e \
        -h string:x-canonical-private-synchronous:brightness_notif \
        -h int:value:"$brightness" \
        -u low \
        -i "$icon_path" \
        "Screen" "Brightness: ${brightness}%"
}

# Change brightness and notify
change_brightness() {
    local delta=$1
    local current new icon

    current=$(get_brightness)
    new=$((current + delta))

    # Clamp between 0 and 100
    (( new < 0 )) && new=0
    (( new > 100 )) && new=100

    brightnessctl -d "$device" set "${new}%"

    icon=$(get_icon_path "$new")
    send_notification "$new" "$icon"
}

# Main
case "$1" in
    "--get")
        get_brightness
        ;;
    "--inc")
        change_brightness "$step"
        ;;
    "--dec")
        change_brightness "-$step"
        ;;
    *)
        get_brightness
        ;;
esac