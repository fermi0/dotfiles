#!/usr/bin/sh
cd ~/.BurpSuite/burpbrowser/144.0.7559.59/

# Backup if not already done
if [ ! -f chrome.original ]; then
    mv chrome chrome.original
fi

# Create new wrapper
cat > chrome << 'EOF'
#!/bin/bash
DIR="$(dirname "$(readlink -f "$0")")"

# Force disable color management in ALL processes
exec "$DIR/chrome.original" \
    --disable-features=WaylandWpColorManagerV1 \
    --force-color-profile=srgb \
    "$@"
EOF

chmod +x chrome
