#!/bin/bash

# OpenSCQ30 Auto-Configuration Script
# Maintains optimal noise cancelling settings for Soundcore Liberty 4 NC

# Configuration
DEVICE_MAC="E8:26:CF:83:B9:46"
DEVICE_NAME="soundcore Liberty 4 NC"

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Check if openscq30-cli is available
if ! command -v openscq30-cli &> /dev/null; then
    echo "openscq30-cli not found. Please install openscq30."
    exit 1
fi

# Check if device is paired
if ! openscq30-cli paired-devices list | grep -q "$DEVICE_MAC"; then
    echo "Device $DEVICE_NAME not paired with openscq30"
    exit 1
fi

# Check if device is connected via bluetooth
if ! bluetoothctl info "$DEVICE_MAC" | grep -q "Connected: yes"; then
    echo "Device $DEVICE_NAME not connected via bluetooth"
    exit 1
fi

# Apply optimal settings
log "Applying optimal settings for $DEVICE_NAME..."

# Set ambient sound mode to noise cancelling
if openscq30-cli device --mac-address "$DEVICE_MAC" setting --set ambientSoundMode=NoiseCanceling &> /dev/null; then
    log "✓ Successfully set ambientSoundMode to NoiseCanceling"
else
    echo "Failed to set ambientSoundMode"
    exit 1
fi

# Set noise cancelling mode to manual
if openscq30-cli device --mac-address "$DEVICE_MAC" setting --set noiseCancelingMode=Manual &> /dev/null; then
    log "✓ Successfully set noiseCancelingMode to Manual"
else
    echo "Failed to set noiseCancelingMode"
    exit 1
fi

# Set manual noise cancelling level to maximum (5)
if openscq30-cli device --mac-address "$DEVICE_MAC" setting --set manualNoiseCanceling=5 &> /dev/null; then
    log "✓ Successfully set manualNoiseCanceling to 5"
else
    echo "Failed to set manualNoiseCanceling"
    exit 1
fi

# Set environment detection to disabled
if openscq30-cli device --mac-address "$DEVICE_MAC" setting --set environmentDetection=false &> /dev/null; then
    log "✓ Successfully set environmentDetection to false"
else
    echo "Failed to set environmentDetection"
    exit 1
fi

log "✓ Auto-configuration completed successfully"

# Verify settings
log "Verifying applied settings:"
openscq30-cli device --mac-address "$DEVICE_MAC" setting \
    --get ambientSoundMode \
    --get noiseCancelingMode \
    --get manualNoiseCanceling \
    --get environmentDetection