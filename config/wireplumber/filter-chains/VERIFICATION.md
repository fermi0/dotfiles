# Audio EQ Verification Guide

created: 2026-09-06
updated: 2026-09-06 (added troubleshooting + TROUBLESHOOTING.md pointer)

**For full troubleshooting, see: `~/.config/wireplumber/TROUBLESHOOTING.md`**

## 1. Confirm Parametric

The EQ IS parametric. It uses PipeWire's native biquad filters:

- `bq_lowshelf` — Low Shelf (EasyEffects "Lo-shelf")
- `bq_peaking` — Peaking/Bell (EasyEffects "Bell")
- `bq_highshelf` — High Shelf (EasyEffects "Hi-shelf")

Each band has full parametric control:
- **Freq** (Hz) — center frequency
- **Q** — quality factor (bandwidth)
- **Gain** (dB) — boost/cut

This is identical to what EasyEffects' parametric equalizer provides, but running natively inside PipeWire (no separate daemon).

## 2. Verify EQ Is Applied

> **2026-09-06 update**: `pw-dump` does NOT show the 10 biquad filter nodes as top-level
> objects — they are internal to the `audioconvert/libspa-audioconvert` filter-graph.
> The canonical check is the journal log (step 4 below), not `pw-dump`.

### Quick check (recommended):
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
                    status = 'ERROR' if has_error else 'OK'
                    print(f'  {p.get(\"node.description\",name)}: {status}')
"
```

Expected output:
```
  soundcore Space One: OK
  soundcore Liberty 4 NC: OK
```

### Check for filter-graph loading errors:
```bash
journalctl --user -u wireplumber --since "1 min ago" | grep -i "spa.filter\|spa.audioconvert"
```

Expected: **no output** (zero errors). If you see `unexpected node key`, `can't load graph`, or `Can't load filter-graph`, the EQ failed to load.

### Debug verification (shows exact filter values):
```bash
systemctl --user stop wireplumber.service
WIREPLUMBER_DEBUG=4 timeout 15 wireplumber 2>&1 | grep "applying filter-graphs"
systemctl --user start wireplumber.service
```

Expected output (one line per device):
```
applying filter-graphs from rule 1 on node: bluez_output.E8_26_CF_83_B9_46.1
applying filter-graphs from rule 2 on node: bluez_output.F4_9D_8A_1C_BE_F6.1
```

## 3. Verify EQ Values Are Correct

The EQ values are sourced from [jaakkopasanen/AutoEq](https://github.com/jaakkopasanen/AutoEq):

- **Space One**: `results/oratory1990/over-ear/Anker Soundcore Space One/`
- **Liberty 4 NC**: `results/Rtings/Bruel & Kjaer 5128 in-ear/Anker Soundcore Liberty 4 NC/`

Compare with the source files:
```bash
curl -sL "https://raw.githubusercontent.com/jaakkopasanen/AutoEq/master/results/oratory1990/over-ear/Anker%20Soundcore%20Space%20One/Anker%20Soundcore%20Space%20One%20ParametricEQ.txt"
curl -sL "https://raw.githubusercontent.com/jaakkopasanen/AutoEq/master/results/Rtings/Bruel%20%26%20Kjaer%205128%20in-ear/Anker%20Soundcore%20Liberty%204%20NC/Anker%20Soundcore%20Liberty%204%20NC%20ParametricEQ.txt"
```

## 5. Verify DSP Chain Quality (F32 + max resampler)

The goal is the highest possible quality Liberty 4 NC's hardware can deliver. Check each:

### Internal format (must be F32LE, not S16/S24)
```bash
pw-dump 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
for obj in data:
    p = obj.get('info', {}).get('props', {})
    if 'E8_26_CF' in p.get('node.name','') and p.get('media.class') == 'Audio/Sink':
        fmt = obj['info']['params']['EnumFormat'][0]
        print(f\"format={fmt['format']['default']} rate={fmt['rate']} channels={fmt['channels']}\")
"
# Expected: format=F32LE rate=48000 channels=2
```

### Resampler quality (must be 14/Kaiser, not default 4)
```bash
journalctl --user -u pipewire-pulse --since "1 min ago" | grep "spa.resample"
# Expected: q:14 w:kaiser (Kaiser window, 1024 taps)
```

> **2026-09-06**: If you see `q:4` (default Blackman), the resampler config is in the wrong
> place. Put it in `~/.config/pipewire/pipewire-pulse.conf.d/99-quality-max.conf` under
> `stream.properties` — NOT in `client-rt.conf.d/` (that dir is never loaded; there is no
> `pipewire-rt` instance on Arch/EndeavourOS).

### LDAC bitrate (must be 990 kbps @ 48kHz, not 660/330)
```bash
journalctl --user -u wireplumber --since "1 min ago" | grep "spa.bluez5.sink.media"
# Expected: using A2DP codec LDAC
```
HQ @ 48kHz = **990 kbps** (source: `ldacBT.h:143`). HQ @ 44.1kHz = 909 kbps.

### Full verification table
See `~/.config/wireplumber/TROUBLESHOOTING.md` → "Full Verification (2026-09-06)".

## 6. Listening Test (A/B Comparison)

Play a familiar track through Strawberry and listen for these signatures:

**Space One (oratory1990):**
- Reduced sub-bass (105 Hz -4.6 dB)
- Boosted lower-mids (494 Hz +4.5 dB)
- Sucked-out upper-mids (1335 Hz -6.2 dB)
- Boosted presence/treble (3318 Hz +5.1, 5539 Hz +4.9)
- Rolled-off highs (10000 Hz -7.0 dB)

**Liberty 4 NC (Rtings B&K):**
- Deep bass cut (105 Hz -6.6 dB)
- Mild mid-bass boost (579 Hz +2.4)
- Sharp notch at ~5 kHz (-20 dB at 5504, +17.4 dB at 4778)
- Slight treble boost (10000 Hz +2.4)

## 7. Advanced: Spectrum Analysis

For a technical verification, play a sine wave and measure the output:

```bash
# Install sox if not already
sudo pacman -S sox

# Generate a 494 Hz test tone (Space One peak)
play -n synth sine 494 gain -10

# Switch to Space One, listen — should be louder than 1000 Hz
wpctl set-default 53  # Space One sink ID

# Generate a 579 Hz test tone (Liberty 4 NC peak)
play -n synth sine 579 gain -10

# Switch to Liberty 4 NC
wpctl set-default 65  # Liberty 4 NC sink ID
```

Or use a spectrum analyzer:
```bash
# Install EasyEffects temporarily just for spectrum view (NOT for EQ)
# Or use: speaker-test -c 2 -t sine
```

## 6. Quick Health Check (all-in-one):

```bash
echo "=== Devices ===" && wpctl status | grep -A8 "Sinks:"
echo "=== Codecs ===" && pw-dump | python3 -c "..."
echo "=== Filter-graph errors ===" && journalctl --user -u wireplumber --since "1 min ago" | grep -c "spa.filter.*error\|spa.audioconvert.*Can't load"
echo "=== Both on LDAC HQ? ===" && grep "ldac" ~/.config/wireplumber/wireplumber.conf.d/51-ldac-hq.conf
```

## Troubleshooting

### EQ not applied:
1. Check `journalctl --user -u wireplumber` for errors
2. Verify `~/.config/wireplumber/wireplumber.conf.d/52-bt-eq.conf` exists
3. Reconnect BT device to trigger fresh filter-graph application

### Wrong codec (msbc instead of ldac):
```bash
# Check available profiles
pactl list cards | grep -A20 "soundcore" | grep "Profiles:"

# Force A2DP LDAC
pactl set-card-profile bluez_card.F4_9D_8A_1C_BE_F6 a2dp-sink

# Or disconnect/reconnect
bluetoothctl disconnect F4:9D:8A:1C:BE:F6
bluetoothctl connect F4:9D:8A:1C:BE:F6
```

### Liberty 4 NC A2DP not connecting:
Liberty 4 NC sometimes takes longer to establish A2DP after WirePlumber restarts. Wait 10-15 seconds, or disconnect/reconnect.

### Filter-graph not loading:
Check for `spa.filter-graph` errors in journalctl. Common causes:
- Mixer preamp with `inputs`/`outputs` properties (not supported in filter-graph format)
- Wrong port names in links (use `node:Out` not `node:FL`)
- Missing `control` section on biquad nodes

### The 2-hour footgun: stringified JSON in `create-filter-graph`
**Symptom**: `audioconvert.filter-graph` is set to empty string. No errors in journal.
`pw-dump` shows OK for the sink (no `unexpected` / `can't load` errors). But the EQ
doesn't actually process audio. `journalctl` shows `setting node filter graph param
'audioconvert.filter-graph.0' to: {` (truncated, but the value is empty/table-not-string).

**Cause**: The `create-filter-graph` action value is a stringified JSON instead of a
nested Lua table. WirePlumber's `applyNodeFilterGraphs` does `value:parse(1)` and inserts
the result into a POD Struct. A string parses to a Lua string, which Pod.Struct serializes
as a POD String of empty content. A nested table gets serialized as a POD Object containing
the graph descriptor, which PipeWire's audioconvert plugin re-serializes to JSON correctly.

**Fix**: Use a proper nested Lua table:
```
create-filter-graph = [
  {
    nodes = [ { type = builtin name = eq_0 label = bq_peaking control = { "Freq" = 105 "Q" = 0.7 "Gain" = -1.6 } } ... ]
    links = [ { output = "eq_0:Out" input = "eq_1:In" } ... ]
  }
]
```
NOT:
```
create-filter-graph = [ "{\"filter.graph\":{\"nodes\":[...]}}" ]
```

**Why this isn't a WirePlumber bug**: PipeWire's `audioconvert.filter-graph.N` prop expects
a JSON string. WirePlumber's Pod.Struct converts Lua tables to POD Objects which audioconvert
re-serializes via its `parse_prop_params` function. The chain only works if the action value
is a Lua table (not a string).

### `wireplumber.profiles` override silently ignored
**Symptom**: You add `50-enable-software-dsp.conf` with
`wireplumber.profiles.main = { node.software-dsp = required }` and restart. The journal
shows `section 'wireplumber.profiles' is used as-is from '/usr/share/wireplumber/wireplumber.conf'`
and no `node/software-dsp.lua` plugin is loaded.

**Cause**: WirePlumber's main conf is "used as-is" — user conf.d fragments cannot override
profile feature settings.

**Fix**: Don't use `node.software-dsp.rules` (which depends on `node/software-dsp.lua`).
Use `node.filter-graph.rules` instead — `scripts/node/filter-graph.lua` is loaded by the
main profile via `hooks.filter.graph` and reads its section directly. See
`~/.config/wireplumber/TROUBLESHOOTING.md` for the full architecture and history.
