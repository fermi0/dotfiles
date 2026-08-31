#!/usr/bin/env bash
# for rainbow borders animation

function random_hex() {
    random_hex=("0xff$(openssl rand -hex 3)")
    echo $random_hex
}

# rainbow colors for active window + inside group - lua-compatible (Hyprland 0.56+)
# hyprctl keyword is broken in lua mode (Use eval). Use hl.config table with colors+angle.
# FIXED: also set group:col.border_active for active window inside group (SUPER+G)
c1=$(random_hex); c2=$(random_hex); c3=$(random_hex); c4=$(random_hex); c5=$(random_hex)
c6=$(random_hex); c7=$(random_hex); c8=$(random_hex); c9=$(random_hex); c10=$(random_hex)
hyprctl eval "hl.config({general={['col.active_border']={colors={'$c1','$c2','$c3','$c4','$c5','$c6','$c7','$c8','$c9','$c10'}, angle=270}}})" >/dev/null
hyprctl eval "hl.config({group={['col.border_active']={colors={'$c1','$c2','$c3','$c4','$c5','$c6','$c7','$c8','$c9','$c10'}, angle=270}}})" >/dev/null

# rainbow colors for inactive window (uncomment to take effect)
#c1=$(random_hex); c2=$(random_hex); c3=$(random_hex); c4=$(random_hex); c5=$(random_hex)
#c6=$(random_hex); c7=$(random_hex); c8=$(random_hex); c9=$(random_hex); c10=$(random_hex)
#hyprctl eval "hl.config({general={['col.inactive_border']={colors={'$c1','$c2','$c3','$c4','$c5','$c6','$c7','$c8','$c9','$c10'}, angle=270}}})" >/dev/null