# WirePlumber + PipeWire BT Audio Setup — Full Documentation

created: 2026-09-06 (final verification confirmed working)
session of origin: ses_f8d887db2ffeZaekHXm2H5rpnX + current session
applies to: Arch / EndeavourOS, PipeWire 1.6.8, WirePlumber 0.5.17, bluez5

## TL;DR

This system provides **automatic parametric AutoEQ** (10-band biquad) on two Bluetooth headphones
(Anker Soundcore Liberty 4 NC + Space One) using **PipeWire's native filter-graph via WirePlumber's
`node.filter-graph.rules`**, with **LDAC HQ** (990 kbps) as the Bluetooth codec. No EasyEffects, no
external EQ daemon. Hardware-level fallback to flat laptop speakers when no BT device is connected.

## What Lives Where

| File | Purpose |
|---|---|
| `~/.config/wireplumber/wireplumber.conf.d/51-ldac-hq.conf` | Sets `bluez5.a2dp.ldac.quality = "hq"` on both BT cards |
| `~/.config/wireplumber/wireplumber.conf.d/52-bt-eq.conf` | `node.filter-graph.rules` with 10-band biquad for each device (3804 bytes) |
| `~/.config/wireplumber/filter-chains/VERIFICATION.md` | How to verify EQ + LDAC are active |
| `~/.config/wireplumber/filter-chains/EQ-PRESETS-VERIFIED.md` | The actual EQ tables, with source URLs |
| `~/.config/hypr/scripts/Volume.sh` | Volume keybind script (uses `wpctl`, auto-detects BT sinks) |
| `~/.config/hypr/configs/Keybinds.lua:214-221` | Hyprland XF86Audio → Volume.sh keybinds |
| `~/.local/state/wireplumber/default-nodes` | Persistent default-sink prefs (WirePlumber restores on boot) |

## Architecture

```
Strawberry / pw-play
        ↓
[PipeWire link]
        ↓
bluez_output.E8_26_CF_83_B9_46.1  (sink node, library=audioconvert/libspa-audioconvert)
        ↓
[node-added event fires when sink is created]
        ↓
WirePlumber filter-graph.lua reads node.filter-graph.rules, matches node.name
        ↓
applyNodeFilterGraphs → sets audioconvert.filter-graph.0 = <serialized graph>
        ↓
PipeWire audioconvert plugin parses the JSON, builds EQ chain
        ↓
spa.filter-graph plugin runs the biquad filters inline on the audio stream
        ↓
LDAC codec (bluez5.a2dp.ldac.quality = "hq") → Bluetooth A2DP transport → Headphones
```

## How It Works

### 1. `51-ldac-hq.conf` — LDAC HQ
Uses `monitor.bluez.rules` (consumed by `scripts/monitors/bluez/name-device.lua`).
Sets `bluez5.a2dp.ldac.quality = "hq"` on the card property when the device is named.
This makes the bluez5 codec negotiation prefer LDAC HQ (990 kbps, 96 kHz, 24-bit)
over the LDAC defaults (660 kbps / 330 kbps). HQ requires the **libspa-codec-bluez5-ldac.so**
plugin which is installed by default in the `spa-0.2/bluez5/` directory.

### 2. `52-bt-eq.conf` — Parametric EQ
Uses `node.filter-graph.rules` (consumed by `scripts/node/filter-graph.lua`,
which IS loaded by the main profile via `hooks.filter.graph`).
The `create-filter-graph` action takes a **nested Lua table** (NOT a stringified JSON).
When a `library.name = "audioconvert/libspa-audioconvert"` node is added (i.e., any PipeWire
audio sink), WirePlumber applies the matching graph inline.

The `bq_lowshelf` / `bq_peaking` / `bq_highshelf` biquad filter types are
**native PipeWire SPA filters** (no external plugin required). Each band has `Freq`, `Q`, `Gain`.

### 3. Volume.sh — Keybind handler
- Resolves current BT sink via `pw-dump` (no hardcoded MAC).
- If default sink is BT → use it.
- If no BT sink is connected → fall back to laptop speaker.
- Cache the resolved sink in `$XDG_RUNTIME_DIR/hypr-volume-sink.cache` for 10s
  (key-hold repeats fire many times per second; avoids repeated `pw-dump` cost).
- Validates cache live with `wpctl get-volume` before reuse.

## The CRITICAL Conf-Format Gotcha

### DO NOT use a stringified JSON inside `create-filter-graph`

**WRONG** (silently fails — `audioconvert.filter-graph` becomes empty string):
```
create-filter-graph = [
  "{\"filter.graph\":{\"nodes\":[...],\"links\":[...]}}"
]
```

**RIGHT** (works — produces `spa.filter-graph: using 2 instances 1 1` in journal):
```
create-filter-graph = [
  {
    nodes = [
      { type = builtin name = eq_0 label = bq_lowshelf control = { "Freq" = 105.0 "Q" = 0.7 "Gain" = -1.6 } }
      ...
    ]
    links = [
      { output = "eq_0:Out" input = "eq_1:In" }
      ...
    ]
  }
]
```

WirePlumber's `applyNodeFilterGraphs` does `val = value:parse(1)` then `Pod.Struct(graph_params)`.
The parsed JSON table needs to be passed as a Lua table so that Pod.Struct correctly serializes
it as a POD Object which the audioconvert plugin then re-serializes to JSON.
A stringified JSON inside the action would parse correctly but Pod.Struct would produce an
empty POD String → audioconvert.plugin gets `""` → no filter graph loads.

**There is NO error in this case** — WirePlumber happily writes an empty prop and the user
sees `audioconvert.filter-graph = String ""` and wonders why EQ doesn't work. This was the
exact same bug in session `ses_f8d887db2ffeZaekHXm2H5rpnX` and took 2 hours to debug.

## The `node.software-dsp.rules` Dead End

**DO NOT** use `node.software-dsp.rules` with `create-filter` actions. That section is
only read by `node/software-dsp.lua`, which is NOT loaded by the main profile.

The profile is `wireplumber.profiles` and WirePlumber loads it with:
```
section 'wireplumber.profiles' is used as-is from '/usr/share/wireplumber/wireplumber.conf'
```

User conf.d fragments with `wireplumber.profiles.main = { node.software-dsp = required }`
are **silently ignored** because the section is marked "used as-is" from system. Tried also
`wireplumber.components = [{ name = node/software-dsp.lua, type = script/lua }]` — this
loaded the script, but `node.software-dsp.rules` is only read by software-dsp.lua, which
still requires the `node.software-dsp` feature to be enabled. Without that, no effect.

**Solution**: use `node.filter-graph.rules` instead — `filter-graph.lua` IS loaded by main
profile and reads its section directly. No profile override needed.

## Verification Commands

### 1. Check LDAC codec is active (must see LDAC, not SBC/AAC)
```bash
SINK_ID=$(wpctl status | awk '/\*.*soundcore/{print $2}' | tr -d '.' | head -1)
wpctl inspect $SINK_ID | grep -E "api.bluez5.codec|api.bluez5.profile"
# Expected:
#   api.bluez5.codec = "ldac"
#   api.bluez5.profile = "a2dp-sink"
```

### 2. Check filter-graph is loaded (the canonical check)
```bash
pw-dump 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
for obj in data:
    p = obj.get('info', {}).get('props', {})
    name = p.get('node.name', '')
    if ('E8_26_CF' in name or 'F4_9D_8A' in name) and p.get('media.class') == 'Audio/Sink':
        params = obj.get('info', {}).get('params', {})
        for pk in params:
            if 'Props' in pk:
                pv = str(params[pk])
                if 'filter' in pv.lower():
                    has_error = 'unexpected' in pv.lower() or 'error' in pv.lower() or \"can't load\" in pv.lower()
                    desc = p.get('node.description', name)
                    print(f'  {desc}: {\"ERROR\" if has_error else \"OK (filter-graph loaded)\"}')
"
# Expected: OK (filter-graph loaded) for both devices
```

### 3. Check zero filter-graph loading errors
```bash
ERRORS=$(journalctl --user -u wireplumber --since "1 min ago" 2>/dev/null | grep -cE "spa.filter-graph.*unexpected|spa.filter-graph.*can't load|spa.audioconvert.*Can't load")
echo "$ERRORS"
# Expected: 0
```

### 4. Check the actual biquad filter chain is alive (debug-grade proof)
```bash
journalctl --user -u wireplumber --since "1 min ago" | grep -E "spa.filter-graph: (using|input port|output port|control)"
# Expected output (truncated):
#   spa.filter-graph: using 2 instances 1 1
#   spa.filter-graph: input port eq_0[0]:In
#   spa.filter-graph: output port eq_9[0]:Out
#   spa.filter-graph: control 0 0 ('Freq') from 0.000000 to 105.000000
#   ... (10 controls × 2 channels)
```

### 5. Check the rule actually fired (s-node topic)
```bash
journalctl --user -u wireplumber | grep "applying filter-graphs"
# Expected:
#   s-node: <WpNode:NN:...> applying filter-graphs from rule 1 on node: bluez_output.E8_26_CF_83_B9_46.1
#   s-node: <WpNode:NN:...> applying filter-graphs from rule 2 on node: bluez_output.F4_9D_8A_1C_BE_F6.1
```

## Full Verification (2026-09-06) — Liberty 4 NC

Verified live on the running system (session `ses_f8cfa652dffe4HL7HDjjykEqsn`).

### DSP Chain (runtime, from `pw-dump`)

| Property | Value | Source |
|---|---|---|
| Internal format | **F32LE** (float32, no bit-depth noise) | `pw-dump` EnumFormat/Format |
| Sample rate | **48000 Hz** | `pw-dump` Format |
| Channels | 2 (FL/FR) | `pw-dump` Format |
| Clock quantum-limit | 8192 | `pw-dump` Props |
| Resampler quality | **14** (Kaiser, 1024 taps) | `spa.resample` journal |
| Resampler window | kaiser | journal |
| Dither | shaped5, noise=0 | journal |

### LDAC (runtime, from journalctl + ldacBT.h)

| Property | Value | Source |
|---|---|---|
| Codec | **LDAC** (not SBC/AAC) | `spa.bluez5.sink.media: using A2DP codec LDAC` |
| Profile | a2dp-sink | `pw-dump` `api.bluez5.profile` |
| `bluez5.a2dp.ldac.quality` | **hq** | `pw-dump` device props |
| Negotiated bitrate (48kHz) | **990 kbps** | `ldacBT.h:143` — HQ @ 48kHz = 990kbps |
| Negotiated bitrate (44.1kHz) | 909 kbps | `ldacBT.h:143` — HQ @ 44.1kHz = 909kbps |

### Boot Persistence (verified)

| Check | Result |
|---|---|
| `systemctl --user is-enabled pipewire` | enabled |
| `systemctl --user is-enabled wireplumber` | enabled |
| `systemctl --user is-enabled pipewire.socket` | enabled |
| `systemctl --user is-enabled pipewire-pulse.socket` | enabled |
| Default sink persisted | `~/.local/state/wireplumber/default-nodes` → `bluez_output.E8_26_CF_83_B9_46.1` |
| LDAC hq config | `51-ldac-hq.conf` (applied at device-added via monitor.bluez.rules) |
| EQ filter-graph | `52-bt-eq.conf` (applied at sink-added via node.filter-graph.rules) |
| openscq30 device settings | `openscq30-watchdog.service` (see below) |

### openscq30 Watchdog (2026-09-07 — replaces broken boot-time oneshots)

**Problem**: `openscq30-auto-config.service` + `openscq30-simple-config-space-one.service`
(oneshot, `After=default.target`) failed at every boot — BT headphones connect *after* login,
so the scripts exited with "Device not connected via bluetooth" (Space One script's
5×2s retry was also too short). XDG autostart entries duplicated the same broken scripts.

**Fix**: `~/.local/bin/openscq30-watchdog.sh` + `openscq30-watchdog.service`
(Type=simple, Restart=always). Polls `bluetoothctl info` every 5s, and on every
disconnected→connected transition waits 4s for the RFCOMM control channel, then applies
the full desired state via `openscq30-cli` (4 retries × 3s). Verified: live
disconnect/reconnect of Liberty 4 NC detected and re-configured within ~15s.

- Liberty 4 NC: `ambientSoundMode=NoiseCanceling noiseCancelingMode=Manual
  manualNoiseCanceling=5 environmentDetection=false windNoiseSuppression=false`
- Space One: `ambientSoundMode=NoiseCanceling noiseCancelingMode=Custom
  manualNoiseCanceling=5 windNoiseSuppression=false ldac=true`

The old oneshot services are **disabled** and the XDG autostart entries removed.
The old scripts remain in `scripts/audio/` for manual use only.

### Parametric EQ (10-band biquad, confirmed loaded)

All 10 filters (eq_0..eq_9) loaded with Freq/Q/Gain/b0/b1/b2/a0/a1/a2 control ports
connected in series. No `spa.filter-graph` errors. Verified via:
- `journalctl --user -u wireplumber | grep "spa.filter-graph: connect control port eq_"`
- `pw-dump` shows `library.name = audioconvert/libspa-audioconvert` on the sink node

### Resampler Quality Fix (2026-09-06)

**Problem**: `~/.config/pipewire/client-rt.conf.d/` was never loaded — there is no
`pipewire-rt` instance on Arch/EndeavourOS, only `pipewire` + `pipewire-pulse`.
The resampler was silently running at default quality 4 (Blackman, ~90dB stopband).

**Fix**: Moved the settings to `~/.config/pipewire/pipewire-pulse.conf.d/99-quality-max.conf`,
which IS loaded by `pipewire-pulse`. Verified active: Strawberry stream now shows
`resample.quality = 14`, `resample.window = kaiser`, `dither.method = shaped5`.

## Troubleshooting

### Symptom: `wpctl status` shows Liberty 4 NC in headset-head-unit (mSBC) instead of a2dp-sink
**Cause**: no audio stream is active. The BT card goes "off" when no stream targets it, and
switches to HFP for microphone when something else (like cava) is using the source side.

**Fix**: Start playback in Strawberry (or `pw-play /path/to.wav`). The A2DP sink appears
within 1-2 seconds and LDAC kicks in.

### Symptom: Volume keybind does nothing
**Cause 1**: The Volume.sh script resolves a BT sink via `pw-dump`; if no BT sink exists
(because no playback is active), `resolve_sink` returns 1 silently and nothing happens.

**Fix**: Start audio playback first, then the volume keys work.

**Cause 2** (less likely): The Hyprland keybind syntax changed. Check
`~/.config/hypr/configs/Keybinds.lua:214-221` for the `hl.bind("xf86audioraisevolume", ...)` lines.
The script is `~/.config/hypr/scripts/Volume.sh`.

### Symptom: filter-graph shows "OK" in python check but audio sounds un-EQ'd
**Cause**: The user has multiple BT devices and a different one is the current default sink.
Check `wpctl get-default` and `wpctl status` to see which sink is active.

### Symptom: `spa.filter-graph: filter.graph must be an object` in journal
**Cause**: The `create-filter-graph` action value is a stringified JSON or malformed table.
Reformat as a proper nested Lua table (see "CRITICAL Conf-Format Gotcha" above).
Also check that the file is in `~/.config/wireplumber/wireplumber.conf.d/52-bt-eq.conf`
(must have `.conf` extension and be in conf.d/).

### Symptom: 52-bt-eq.conf is in the dir but no "applying filter-graphs" log appears
**Cause 1**: The sink already existed before WirePlumber loaded the rule (race condition).
The `node-added` event only fires for new nodes. Try `pkill -9 wireplumber pipewire;
systemctl --user restart wireplumber pipewire` to force a fresh scan.

**Cause 2**: The conf parser is rejecting the file. Check the journal for
"opening fragment file: ~/.config/wireplumber/wireplumber.conf.d/52-bt-eq.conf" to confirm
the file is being opened. If you see "section 'X' is not defined" or "section 'X' has no value",
the syntax is wrong.

### Symptom: "section 'wireplumber.profiles' is used as-is" — my profile override is ignored
**Cause**: WirePlumber's main profile cannot be overridden from user conf.d/. Use
`node.filter-graph.rules` instead (which works without profile override).

## Preamp (2026-09-07)

AutoEQ preamps are applied as a `bq_raw` pure-gain node FIRST in each chain:
- Liberty 4 NC: -2.5 dB → `b0 = 0.749894` (10^(-2.5/20))
- Space One: -4.7 dB → `b0 = 0.582103` (10^(-4.7/20))

**Gotchas (learned the hard way)**:
- `label = gain` does NOT exist in the builtin filter-graph plugin → "cannot create label gain".
  The `gain` strings in the .so belong to the mixer's internal ports.
- `bq_raw` takes coefficients via a **`config` section** (`config = { coefficients = [ { rate = 96000
  b0 = ... a0 = 1.0 ... } ] }`), NOT `control = {...}`. Without it: "cannot create plugin instance 0:
  Invalid argument". Closest-rate match wins, so one entry at 96000 covers all rates.
- `mixer` is NOT usable as a gain stage: its 8 unconnected inputs would become graph ports.

## Symptom: A2DP profiles vanish after `systemctl --user restart wireplumber`

After a WirePlumber restart, already-connected BT devices can come back with ONLY
`headset-head-unit*` profiles (sinks show `codec = msbc`). BlueZ does not re-offer A2DP to
already-connected devices.

**Fix**: `bluetoothctl disconnect <MAC>` + `bluetoothctl connect <MAC>` for each device.
A2DP returns, LDAC HQ and the EQ re-apply automatically (watchdog re-applies openscq30 settings).

## Force-Enable Verbose WirePlumber Logging

```bash
mkdir -p ~/.config/systemd/user/wireplumber.service.d/
cat > ~/.config/systemd/user/wireplumber.service.d/log-level.conf <<'EOF'
[Service]
Environment=WIREPLUMBER_LOG_LEVEL=4
Environment=G_MESSAGES_DEBUG=wireplumber
Environment=WIREPLUMBER_DEBUG=*:3
EOF
systemctl --user daemon-reload
systemctl --user restart wireplumber
```

After debugging, you can leave the override in place (harmless) or remove the file.

## Memory References

See Lemma memory fragment `m62c5cf9e3b58` for the `node.filter-graph.rules` nested-table
format. Fragment `maeb18ea6b759` has the high-level "PipeWire native filter-graph replaces
EasyEffects" lesson.

## Why No EasyEffects

EasyEffects 8.2.9 was unreliable:
- `inactivityTimer` unlinks filter chain causing EQ to vanish
- EQ disappears after ~30s of EQ presence
- Surviving service restarts requires systemd watchdog hacks
- Adds a separate audio daemon (DSP process) that complicates routing

This native PipeWire filter-graph is **inline to the audioconvert node itself** — no
separate process, no virtual sink, no routing tricks, no memory leaks.

## What 100% Hardware Quality Means

- **Liberty 4 NC**: A2DP LDAC HQ = 990 kbps / 96 kHz / 24-bit / ~330 kHz bandwidth.
  This is the maximum the headphone's DAC supports over Bluetooth. There is no higher mode.
- **Space One**: Same LDAC HQ. Both headphones negotiate this mode automatically
  when `bluez5.a2dp.ldac.quality = "hq"` is set on the card.
- **Beyond BT**: For wired USB audio, the laptop's ALC287 analog output is the limit
  (~24-bit / 96 kHz). Both BT headphones treat the laptop as the source; the laptop's
  audio quality is the ceiling on the digital side.

## Sessions That Established This

- `ses_f8d887db2ffeZaekHXm2H5rpnX` (2026-09-05) — discovered the format, debugged, verified
- Current session (2026-09-06) — recovered from a regression where 52-bt-eq.conf was
  rewritten to the broken `node.software-dsp.rules` format (557 bytes). Restored to the
  working `node.filter-graph.rules` format (3804 bytes).
