#!/usr/bin/env bash
# A bash script designed to run only once dotfiles installed

# THIS SCRIPT CAN BE DELETED ONCE SUCCESSFULLY BOOTED!! And also, edit ~/.config/hypr/configs/Settings.conf
# NOT necessary to do since this script is only designed to run only once as long as the marker exists
# marker file is located at ~/.config/hypr/.initial_startup_done
# However, I do highly suggest not to touch it since again, as long as the marker exist, script wont run

# Variables
scriptsDir=$HOME/.config/hypr/scripts
wallpaper=$HOME/.config/hypr/wallpaper_effects/.wallpaper_current
waybar_style="$HOME/.config/waybar/style/[Extra] Neon Circuit.css"
kvantum_theme="catppuccin-mocha-blue"
color_scheme="prefer-dark"
gtk_theme="Flat-Remix-GTK-Blue-Dark"
icon_theme="Flat-Remix-Blue-Dark"
cursor_theme="Bibata-Modern-Ice"

awwwcmd="awww img"
effect="--transition-bezier .43,1.19,1,.4 --transition-fps 30 --transition-type grow --transition-pos 0.925,0.977 --transition-duration 2"

# --- wallust: deliberately NOT marker-gated ---------------------------
# The colour templates (WallustColors.lua, wallust-hyprland.conf, and the
# rofi/kitty/waybar/cava ones) must be regenerated on EVERY boot, or
# Hyprland and hyprlock load week-old colours. This used to sit inside the
# marker-gated block below, so it only ever ran on the very first boot --
# and even then only if .wallpaper_current existed.
#
# WallustSwww.sh reads the wallpaper from awww and exits 0 silently when
# there is none, so calling it unconditionally is safe. awww-daemon is
# started later in the startup chain, so wait for it before asking.
(
    for _ in 1 2 3 4 5 6 7 8 9 10; do
        pgrep -x awww-daemon >/dev/null && break
        sleep 0.5
    done
    "$scriptsDir/WallustSwww.sh"
) >/dev/null 2>&1 &

# Check if a marker file exists.
if [ ! -f "$HOME/.config/hypr/.initial_startup_done" ]; then
    sleep 1
    # Initialize wallpaper (wallust is handled above, unconditionally)
	if [ -f "$wallpaper" ]; then
		awww query || awww-daemon && $awwwcmd $wallpaper $effect
	fi
     
    # initiate GTK dark mode and apply icon and cursor theme
    gsettings set org.gnome.desktop.interface color-scheme $color_scheme > /dev/null 2>&1 &
    gsettings set org.gnome.desktop.interface gtk-theme $gtk_theme > /dev/null 2>&1 &
    gsettings set org.gnome.desktop.interface icon-theme $icon_theme > /dev/null 2>&1 &
    gsettings set org.gnome.desktop.interface cursor-theme $cursor_theme > /dev/null 2>&1 &
    gsettings set org.gnome.desktop.interface cursor-size 24 > /dev/null 2>&1 &

     # NIXOS initiate GTK dark mode and apply icon and cursor theme
	if [ -n "$(grep -i nixos < /etc/os-release)" ]; then
      gsettings set org.gnome.desktop.interface color-scheme "'$color_scheme'" > /dev/null 2>&1 &
      dconf write /org/gnome/desktop/interface/gtk-theme "'$gtk_theme'" > /dev/null 2>&1 &
      dconf write /org/gnome/desktop/interface/icon-theme "'$icon_theme'" > /dev/null 2>&1 &
      dconf write /org/gnome/desktop/interface/cursor-theme "'$cursor_theme'" > /dev/null 2>&1 &
      dconf write /org/gnome/desktop/interface/cursor-size "24" > /dev/null 2>&1 &
	fi
       
    # initiate kvantum theme
    kvantummanager --set "$kvantum_theme" > /dev/null 2>&1 &

    # initiate the kb_layout (for some reason) waybar cant launch it
    "$scriptsDir/SwitchKeyboardLayout.sh" > /dev/null 2>&1 &

	# waybar style
	#if [ -L "$HOME/.config/waybar/config" ]; then
    ##    	ln -sf "$waybar_style" "$HOME/.config/waybar/style.css"
    #   	"$scriptsDir/Refresh.sh" > /dev/null 2>&1 & 
	#fi


    # Create a marker file to indicate that the script has been executed.
    touch "$HOME/.config/hypr/.initial_startup_done"

    exit
fi
