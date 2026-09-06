#!/bin/bash

# OpenSCQ30 Auto-Configuration Script
# Maintains optimal noise cancelling settings for Soundcore Space One
# Model: SoundcoreA3035

# Configuration
DEVICE_MAC="F4:9D:8A:1C:BE:F6"
DEVICE_NAME="soundcore Space One"
MAX_RETRIES=5
RETRY_DELAY=2

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Check if openscq30-cli is available
if ! command -v openscq30-cli &> /dev/null; then
    echo "openscq30-cli not found. Please install openscq30."
    exit 1
fi

# Check if device is paired with openscq30
if ! openscq30-cli paired-devices list | grep -q "$DEVICE_MAC"; then
    echo "Device $DEVICE_NAME not paired with openscq30."
    echo "Pairing now..."
    openscq30-cli paired-devices add --mac-address "$DEVICE_MAC" --model "SoundcoreA3035" 2>&1
    if [ $? -ne 0 ]; then
        echo "Failed to pair device with openscq30"
        exit 1
    fi
    log "Device paired with openscq30"
fi

# Check if device is connected via bluetooth
check_device_connected() {
    if echo "info $DEVICE_MAC" | bluetoothctl 2>/dev/null | grep -q "Connected: yes"; then
        return 0
    else
        return 1
    fi
}

# Wait for device to connect
wait_for_device() {
    local attempt=0
    while [ $attempt -lt $MAX_RETRIES ]; do
        if check_device_connected; then
            log "Device $DEVICE_NAME is connected via Bluetooth"
            return 0
        fi
        attempt=$((attempt + 1))
        warn "Waiting for device... (attempt $attempt/$MAX_RETRIES)"
        sleep $RETRY_DELAY
    done
    error "Device $DEVICE_NAME not available after $MAX_RETRIES attempts"
    return 1
}

if ! wait_for_device; then
    exit 1
fi

# Apply optimal settings
log "Applying optimal settings for $DEVICE_NAME..."

# Set ambient sound mode to NoiseCanceling
if openscq30-cli device --mac-address "$DEVICE_MAC" setting --set ambientSoundMode=NoiseCanceling &> /dev/null; then
    log "✓ Set ambientSoundMode to NoiseCanceling"
else
    error "Failed to set ambientSoundMode"
fi

# Set noise canceling mode to Custom (Space One's equivalent of Liberty 4 NC's "Manual")
# Space One uses "Custom" mode which enables manual noise canceling level control
if openscq30-cli device --mac-address "$DEVICE_MAC" setting --set noiseCancelingMode=Custom &> /dev/null; then
    log "✓ Set noiseCancelingMode to Custom"
else
    error "Failed to set noiseCancelingMode"
fi

# Set manual noise canceling level to maximum (5)
if openscq30-cli device --mac-address "$DEVICE_MAC" setting --set manualNoiseCanceling=5 &> /dev/null; then
    log "✓ Set manualNoiseCanceling to 5 (maximum)"
else
    error "Failed to set manualNoiseCanceling"
fi

# Disable wind noise suppression
if openscq30-cli device --mac-address "$DEVICE_MAC" setting --set windNoiseSuppression=false &> /dev/null; then
    log "✓ Set windNoiseSuppression to false"
else
    error "Failed to set windNoiseSuppression"
fi

# Enable LDAC for highest audio quality
# Note: Space One supports LDAC, Liberty 4 NC does not expose this as an openscq30 setting
if openscq30-cli device --mac-address "$DEVICE_MAC" setting --set ldac=true &> /dev/null; then
    log "✓ Set ldac to true"
else
    warn "Could not set ldac (may already be enabled or not supported)"
fi

log "✓ Auto-configuration completed successfully"

# Verify settings
log "Verifying applied settings:"
openscq30-cli device --mac-address "$DEVICE_MAC" setting \
    --get ambientSoundMode \
    --get noiseCancelingMode \
    --get manualNoiseCanceling \
    --get windNoiseSuppression \
    --get ldac

exit 0
