-- ~/.config/hypr/hyprland.lua — entry point (Lua config, Hyprland 0.55+)
-- Converted from hyprland.conf; source order preserved exactly.
-- Legacy hyprland.conf is kept untouched as instant rollback:
-- delete/rename THIS file and restart Hyprland to return to it.

local home   = os.getenv("HOME")
local cfgdir = home .. "/.config/hypr"

-- make all config-dir modules requirable
package.path = cfgdir .. "/?.lua;" .. cfgdir .. "/configs/?.lua;" .. package.path

----------------------------------------
-- Shared globals (were $vars in hyprlang)
----------------------------------------
mainMod     = "SUPER"
scriptsDir  = cfgdir .. "/scripts"
UserScripts = scriptsDir -- legacy alias; scripts now live in scripts/
edit        = "nvim"
term        = "kitty"
files       = "kitty -e yazi"
Search_Engine = "https://www.google.com/search?q={}"

----------------------------------------
-- Initial boot script (marker-gated)
----------------------------------------
hl.on("hyprland.start", function()
    hl.exec_cmd(cfgdir .. "/initial-boot.sh")
end)

----------------------------------------
-- Source chain (same order as hyprland.conf)
----------------------------------------
require("Keybinds")        -- also loads AppDefaults early: $term/$files for binds
require("Startup_Apps")
require("ENVariables")
require("Laptops")         -- includes former LaptopDisplay (was empty)
require("WindowRules")
require("SystemSettings")
require("Decorations")     -- loads WallustColors (wallust-generated globals)
require("Animations")

-- nwg-displays (generates both monitors.conf and monitors.lua)
require("monitors")
-- workspaces.conf was comments-only; no lua counterpart needed
