#!/bin/bash

# OpenSCQ30 Watchdog — connection-triggered auto-configuration
# Replaces the boot-time oneshot services (which failed because BT devices
# connect AFTER login). Runs forever, polls every POLL_INTERVAL seconds,
# and applies the desired settings on every disconnected -> connected
# transition. Idempotent: settings are only pushed on a rising edge.

POLL_INTERVAL=5
SETTLE_DELAY=4      # wait after connect for RFCOMM/control channel
APPLY_RETRIES=4     # openscq30-cli attempts per connect event
APPLY_RETRY_DELAY=3

log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }
warn() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1"; }

is_connected() {
    bluetoothctl info "$1" 2>/dev/null | grep -q "Connected: yes"
}

apply_with_retry() {
    local mac="$1"; shift
    local desc="$1"; shift
    # remaining args: setting=value pairs
    local attempt=1
    while [ $attempt -le $APPLY_RETRIES ]; do
        local args=()
        for kv in "$@"; do args+=(--set "$kv"); done
        if openscq30-cli device --mac-address "$mac" setting "${args[@]}" &>/dev/null; then
            log "✓ $desc applied ($mac)"
            return 0
        fi
        warn "$desc apply attempt $attempt/$APPLY_RETRIES failed ($mac)"
        sleep $APPLY_RETRY_DELAY
        attempt=$((attempt + 1))
    done
    warn "✗ $desc FAILED after $APPLY_RETRIES attempts ($mac)"
    return 1
}

configure_liberty() {
    apply_with_retry "E8:26:CF:83:B9:46" "Liberty 4 NC config" \
        ambientSoundMode=NoiseCanceling \
        noiseCancelingMode=Manual \
        manualNoiseCanceling=5 \
        environmentDetection=false \
        windNoiseSuppression=false
}

configure_space_one() {
    apply_with_retry "F4:9D:8A:1C:BE:F6" "Space One config" \
        ambientSoundMode=NoiseCanceling \
        noiseCancelingMode=Custom \
        manualNoiseCanceling=5 \
        windNoiseSuppression=false \
        ldac=true
}

if ! command -v openscq30-cli &>/dev/null; then
    echo "openscq30-cli not found. Install openscq30."
    exit 1
fi

log "watchdog started (poll=${POLL_INTERVAL}s)"

liberty_prev=0
space_one_prev=0

while true; do
    if is_connected "E8:26:CF:83:B9:46"; then cur=1; else cur=0; fi
    if [ "$cur" = 1 ] && [ "$liberty_prev" = 0 ]; then
        log "Liberty 4 NC connected — applying config in ${SETTLE_DELAY}s"
        sleep $SETTLE_DELAY
        # re-check: device may have dropped during settle
        if is_connected "E8:26:CF:83:B9:46"; then
            configure_liberty
        else
            warn "Liberty 4 NC dropped during settle — skipping"
        fi
    fi
    liberty_prev=$cur

    if is_connected "F4:9D:8A:1C:BE:F6"; then cur=1; else cur=0; fi
    if [ "$cur" = 1 ] && [ "$space_one_prev" = 0 ]; then
        log "Space One connected — applying config in ${SETTLE_DELAY}s"
        sleep $SETTLE_DELAY
        if is_connected "F4:9D:8A:1C:BE:F6"; then
            configure_space_one
        else
            warn "Space One dropped during settle — skipping"
        fi
    fi
    space_one_prev=$cur

    sleep $POLL_INTERVAL
done
