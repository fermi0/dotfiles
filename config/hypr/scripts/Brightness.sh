#!/usr/bin/env bash
# Script for Monitor backlights (if supported) using brightnessctl
# Dynamically detects the correct backlight device for iGPU/dGPU modes

iDIR="$HOME/.config/swaync/icons"
notification_timeout=1000
step=10  # INCREASE/DECREASE BY THIS VALUE

# Extract the owning GPU's PCI address (deepest 0000:bb:dd.f) from a sysfs path.
# e.g. /sys/devices/pci0000:00/0000:00:06.0/0000:02:00.0/drm/card2 -> 0000:02:00.0
pci_owner() {
    grep -oE '0000:[0-9a-f]{2}:[0-9a-f]{2}\.[0-9]' <<<"$1" | tail -1
}

# Auto-detect the backlight device that actually drives the internal panel.
# nvidia_wmi_ec_backlight always registers /sys/class/backlight/nvidia_0, even in
# hybrid/Dynamic Graphics mode where the panel is driven by the iGPU -- so its
# mere existence says nothing about which GPU owns the panel.
# Resolve instead: find the card owning the connected eDP panel, then match the
# backlight registered under the same GPU. Matching on the owning PCI address
# (not a path prefix) is required because the two drivers register differently:
#   intel: .../0000:00:02.0/drm/card1/card1-eDP-1/intel_backlight
#   nvidia: .../0000:02:00.0/backlight/nvidia_0
detect_backlight_device() {
    local panel conn card bl owner

    # /sys/class/drm is flat: connectors are siblings of cards (card1-eDP-1)
    for panel in /sys/class/drm/card*-eDP-*/; do
        [[ -r "$panel/status" ]] || continue
        [[ "$(<"$panel/status")" == "connected" ]] || continue

        conn=$(basename "${panel%/}")      # card1-eDP-1
        card=${conn%%-*}                    # card1 (card names are "cardN", never dashed)
        owner=$(pci_owner "$(readlink -f "/sys/class/drm/$card/device")")
        [[ -n "$owner" ]] || continue

        for bl in /sys/class/backlight/*; do
            if [[ "$(pci_owner "$(readlink -f "$bl")")" == "$owner" ]]; then
                basename "$bl"
                return 0
            fi
        done
    done

    # Fallback: prefer intel, then first available
    if [[ -e /sys/class/backlight/intel_backlight ]]; then
        echo "intel_backlight"
    else
        ls /sys/class/backlight/ 2>/dev/null | head -1
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