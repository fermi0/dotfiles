#!/bin/bash

# OpenSCQ30 Auto-Configuration Script
# Maintains optimal noise cancelling settings for Soundcore Liberty 4 NC

# Configuration
DEVICE_MAC="E8:26:CF:83:B9:46"
DEVICE_NAME="soundcore Liberty 4 NC"
MAX_RETRIES=5
RETRY_DELAY=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if openscq30-cli is available
if ! command -v openscq30-cli &> /dev/null; then
    error "openscq30-cli not found. Please install openscq30."
    exit 1
fi

# Check if device is paired
check_device_paired() {
    if openscq30-cli paired-devices list | grep -q "$DEVICE_MAC"; then
        return 0
    else
        warn "Device $DEVICE_NAME not paired with openscq30"
        return 1
    fi
}

# Check if device is connected via bluetooth
check_device_connected() {
    if bluetoothctl info "$DEVICE_MAC" | grep -q "Connected: yes"; then
        return 0
    else
        warn "Device $DEVICE_NAME not connected via bluetooth"
        return 1
    fi
}

# Apply optimal settings
apply_settings() {
    log "Applying optimal settings for $DEVICE_NAME..."
    
    # Define settings to apply
    settings=(
        "ambientSoundMode=NoiseCanceling"
        "noiseCancelingMode=Manual"
        "manualNoiseCanceling=5"
        "environmentDetection=false"
    )
    
    # Skip problematic settings for now
    # windNoiseSuppression will need to be configured manually
    
    # Apply each setting
for setting in "${settings[@]}"; do
        setting_id="${setting%%=*}"
        setting_value="${setting#*=}"
        
        log "Setting $setting_id to '$setting_value'"
        
        if openscq30-cli device --mac-address "$DEVICE_MAC" setting --set "$setting_id=$setting_value" &> /dev/null; then
            log "✓ Successfully set $setting_id"
        else
            error "Failed to set $setting_id"
            return 1
        fi
    done
    
    log "All optimal settings applied successfully"
    return 0
}

# Wait for device connection
wait_for_device() {
    local attempt=0
    
    while [ $attempt -lt $MAX_RETRIES ]; do
        if check_device_paired && check_device_connected; then
            log "Device $DEVICE_NAME is ready"
            return 0
        fi
        
        attempt=$((attempt + 1))
        warn "Waiting for device... (attempt $attempt/$MAX_RETRIES)"
        sleep $RETRY_DELAY
    done
    
    error "Device $DEVICE_NAME not available after $MAX_RETRIES attempts"
    return 1
}

# Main execution
main() {
    log "Starting OpenSCQ30 auto-configuration for $DEVICE_NAME"
    
    # Wait for device to be available
    if ! wait_for_device; then
        exit 1
    fi
    
    # Apply settings
    if apply_settings; then
        log "✓ Auto-configuration completed successfully"
        
        # Verify settings
        log "Verifying applied settings:"
        openscq30-cli device --mac-address "$DEVICE_MAC" setting \
            --get ambientSoundMode \
            --get noiseCancelingMode \
            --get manualNoiseCanceling \
            --get windNoiseSuppression \
            --get environmentDetection
        
        exit 0
    else
        error "Auto-configuration failed"
        exit 1
    fi
}

# Run main function
main