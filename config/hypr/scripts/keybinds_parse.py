#!/usr/bin/env python3
"""Parse Keybinds.lua and output clean 'KEY  ->  Description' lines for rofi."""
import re, os, sys

LUA = os.path.expanduser("~/.config/hypr/configs/Keybinds.lua")

SCRIPT_MAP = {
    "KeyHints": "Show key hints / cheatsheet",
    "KeyBinds": "Show all keybinds (this menu)",
    "Refresh": "Refresh Hyprland / Waybar",
    "RefreshNoWaybar": "Refresh Hyprland",
    "RofiEmoji": "Emoji picker",
    "GameMode": "Toggle game mode",
    "ChangeLayout": "Toggle dwindle / master layout",
    "ClipManager": "Clipboard manager",
    "Dropterminal": "Dropdown terminal",
    "WaybarStyles": "Waybar style selector",
    "WallpaperSelect": "Wallpaper selector",
    "WallpaperEffects": "Wallpaper effects",
    "WallpaperRandom": "Random wallpaper",
    "Animations": "Animation theme selector",
    "ZshChangeTheme": "Change Zsh theme",
    "RofiCalc": "Calculator (rofi)",
    "KillActiveProcess": "Kill active window process",
    "LockScreen": "Lock screen",
    "Wlogout": "Power menu (logout / reboot / shutdown)",
    "AirplaneMode": "Toggle airplane mode",
    "RofiSearch": "Web search",
    "OverviewToggle": "Desktop overview",
    "RofiThemeSelector": "Rofi theme selector",
    "SwitchKeyboardLayout": "Switch keyboard layout",
    "Hyprsunset": "Toggle night light",
    "WaybarLayout": "Waybar layout menu",
    "Quick_Settings": "Quick settings menu",
    "RofiBeats": "Online music",
    "ChangeBlur": "Toggle blur",
    "ScreenShot": "Screenshot",
    "Volume": "Volume control",
    "MediaCtrl": "Media control",
}

CODE_MAP = {10:1,11:2,12:3,13:4,14:5,15:6,16:7,17:8,18:9,19:0}

def fmt_key(expr):
    """Convert lua key expression to readable form."""
    s = expr.replace("mainMod", "SUPER")
    s = s.replace("..", " ")
    s = s.replace('"', "").replace("'", "")
    s = re.sub(r"\s+", " ", s).strip()
    parts = [p.strip() for p in s.split("+")]
    out = []
    for p in parts:
        if not p:
            continue
        m = re.match(r"code:(\d+)", p)
        if m:
            n = int(m.group(1))
            out.append(str(CODE_MAP.get(n, n)))
        else:
            out.append(p)
    return " + ".join(out)


def describe(cmd):
    """Map a lua command string to a concise human description."""
    c = cmd.strip()

    # --- exec_cmd with script path ---
    m = re.search(r'exec_cmd\((.+?)\)\s*[,)]?\s*$', c)
    if not m:
        m = re.search(r'exec_cmd\((.+?)\)\s*\)', c)
    if m:
        inner = m.group(1).strip()
        # strip wrapping quotes and os.getenv concat
        inner_clean = inner
        if inner.startswith("os.getenv"):
            inner_clean = re.sub(r'os\.getenv\("HOME"\)\s*\.\.\s*', "~/", inner)
            inner_clean = inner_clean.strip('"').strip("'")
        # rofi
        if "rofi -show drun" in inner:
            return "App launcher (rofi drun)"
        if "rofi -show window" in inner:
            return "Window switcher (rofi)"
        if "swaync-client" in inner:
            return "Toggle notification center"
        if "systemctl suspend" in inner:
            return "Suspend system"
        # script-based
        sm = re.search(r'/([A-Za-z0-9_\-]+)\.sh', inner)
        if sm:
            name = sm.group(1)
            base = SCRIPT_MAP.get(name, name)
            if name == "ScreenShot":
                if "--now" in inner: return "Screenshot (now)"
                if "--area" in inner: return "Screenshot (select area)"
                if "--in5" in inner: return "Screenshot (in 5s)"
                if "--in10" in inner: return "Screenshot (in 10s)"
                if "--active" in inner: return "Screenshot (active window)"
                if "--swappy" in inner: return "Screenshot & edit (swappy)"
            if name == "SmartIntoGroup":
                return "Move window into group (auto-direction)"
            if name == "Volume":
                if "--inc" in inner: return "Volume up"
                if "--dec" in inner: return "Volume down"
                if "--toggle-mic" in inner: return "Toggle mic mute"
                if "--toggle" in inner: return "Toggle audio mute"
            if name == "MediaCtrl":
                if "--pause" in inner: return "Media play / pause"
                if "--nxt" in inner: return "Media next track"
                if "--prv" in inner: return "Media previous track"
                if "--stop" in inner: return "Media stop"
            return base
        # term
        if inner.strip() == "term" or inner.strip() == '"term"':
            return "Open terminal (kitty)"
        # fallback
        short = inner[:50]
        return f"Run: {short}"

    # --- function() binds (multi-line, e.g. SUPER+Space) ---
    if c.startswith("function") or "function()" in c:
        if "float" in c and "center" in c:
            return "Toggle floating + center window"
        if "float" in c:
            return "Toggle floating"
        if "center" in c:
            return "Center window"
        return "Custom action"

    # --- dispatchers ---
    if "window.fullscreen" in c:
        if "maximized" in c:
            return "Toggle fullscreen (maximized)"
        return "Toggle fullscreen"
    if "window.float" in c:
        return "Toggle floating"
    if "window.center" in c:
        return "Center window"
    if "window.pseudo" in c:
        return "Toggle pseudotile"
    if "window.cycle_next" in c:
        return "Cycle floating windows"
    if "window.close" in c:
        return "Close active window"
    if "window.resize" in c:
        m = re.search(r"x\s*=\s*(-?\d+)", c)
        m2 = re.search(r"y\s*=\s*(-?\d+)", c)
        if m and m2:
            x, y = int(m.group(1)), int(m2.group(1))
            if x < 0: return "Resize narrower (hold)"
            if x > 0: return "Resize wider (hold)"
            if y < 0: return "Resize shorter (hold)"
            return "Resize taller (hold)"
        return "Resize window (hold)"
    if "window.move" in c:
        if "out_of_group" in c:
            return "Move window out of group"
        if "into_or_create_group" in c:
            dm = re.search(r'into_or_create_group\s*=\s*"(\w+)"', c)
            d = dm.group(1) if dm else "auto"
            return f"Move window into group ({d})"
        if "workspace" in c:
            wm = re.search(r'workspace\s*=\s*"?(\w+)"?', c)
            ws = wm.group(1) if wm else "?"
            if ws == "special":
                return "Move window to special workspace"
            silent = "follow" in c and "false" in c
            return f"Move window to ws {ws}" + (" (silent)" if silent else " (follow)")
        dm = re.search(r'direction\s*=\s*"(\w+)"', c)
        if dm:
            return f"Move window {dm.group(1)}"
        return "Move window"
    if "focus" in c and "workspace" in c:
        wm = re.search(r'workspace\s*=\s*(\d+)', c)
        return f"Switch to workspace {wm.group(1)}" if wm else "Focus workspace"
    if "focus" in c and "direction" in c:
        dm = re.search(r'direction\s*=\s*"(\w+)"', c)
        return f"Focus window {dm.group(1)}" if dm else "Focus window"
    if "focus" in c and "urgent" in c:
        return "Focus urgent / last window"
    if "workspace.toggle_special" in c:
        return "Toggle special workspace"
    if "workspace.move" in c:
        mm = re.search(r'monitor\s*=\s*"(\w+)"', c)
        return f"Move workspace to monitor {mm.group(1)}" if mm else "Move workspace"
    if "workspace.swap_monitors" in c:
        return "Swap workspaces between monitors"
    if "group.toggle" in c:
        return "Toggle window group"
    if "group.next" in c:
        fm = re.search(r"forward\s*=\s*(false|true)", c)
        if fm:
            return "Prev window in group" if fm.group(1) == "false" else "Next window in group"
        return "Cycle group windows"
    if "group.lock" in c:
        return "Lock / unlock active group"
    if "exit" in c:
        return "Exit Hyprland"

    return "Hyprland action"


def parse_binds():
    with open(LUA, "r") as f:
        content = f.read()

    lines = content.split("\n")
    results = []

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line or line.startswith("--"):
            i += 1
            continue
        if "hl.bind" not in line:
            i += 1
            continue

        # Capture full bind (may span multiple lines for function())
        full = line
        if "function(" in line and "end)" not in line:
            j = i + 1
            while j < len(lines):
                full += " " + lines[j].strip()
                if "end)" in lines[j]:
                    break
                j += 1
            i = j + 1
        else:
            i += 1

        # Extract key and command
        m = re.match(r'hl\.bind\((.+?),\s*(.+?)(?:,\s*\{[^}]*\})?\s*\)\s*$', full)
        if not m:
            m = re.match(r'hl\.bind\((.+?),\s*(.+?)(?:,\s*\{[^}]*\})?\s*\)', full)
        if not m:
            continue

        key_expr = m.group(1).strip()
        cmd_expr = m.group(2).strip()

        # Skip function() binds - handle specially
        if cmd_expr.startswith("function"):
            cmd_for_desc = full
        else:
            cmd_for_desc = cmd_expr

        key = fmt_key(key_expr)
        desc = describe(cmd_for_desc)
        results.append((key, desc))

    return results


def main():
    binds = parse_binds()
    if not binds:
        print("No keybinds found")
        return
    max_key = max(len(k) for k, _ in binds)
    for key, desc in binds:
        print(f"{key.ljust(max_key)}  ->  {desc}")


if __name__ == "__main__":
    main()
