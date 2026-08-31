#!/usr/bin/env perl
use strict;
use warnings;

while (<STDIN>) {
    # Clamp animation speed to max 100
    s/speed = (\d+\.?\d*)/ "speed = " . ($1 > 100 ? 100 : $1) /ge;
    # Clamp curve points to [-1.0, 2.0] (Hyprland limits)
    s/\{ *(-?\d+\.?\d*) *, *(-?\d+\.?\d*) *\}/ "{" . ($1 > 2 ? 2 : $1 < -1 ? -1 : $1) . ", " . ($2 > 2 ? 2 : $2 < -1 ? -1 : $2) . "}" /ge;
    print;
}
