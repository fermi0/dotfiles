# Verified AutoEQ Presets (PipeWire filter-graph)

created: 2026-09-05 (verified: 2026-09-06)
source: github.com/jaakkopasanen/AutoEq
verified: filter-graph loaded without errors, no spa.filter-graph warnings

## Source URLs (verified)

- Space One (oratory1990): https://raw.githubusercontent.com/jaakkopasanen/AutoEq/master/results/oratory1990/over-ear/Anker%20Soundcore%20Space%20One/Anker%20Soundcore%20Space%20One%20ParametricEQ.txt
- Liberty 4 NC (Rtings B&K 5128): https://raw.githubusercontent.com/jaakkopasanen/AutoEq/master/results/Rtings/Bruel%20%26%20Kjaer%205128%20in-ear/Anker%20Soundcore%20Liberty%204%20NC/Anker%20Soundcore%20Liberty%204%20NC%20ParametricEQ.txt

## Space One (oratory1990) — MAC: F4:9D:8A:1C:BE:F6

- Preamp: -4.7 dB (not applied in filter-graph; F32LE processing prevents internal clipping)
- 10 bands:

| # | Type | Fc (Hz) | Q | Gain (dB) |
|---|------|---------|------|----------|
| 1 | bq_lowshelf | 105 | 0.7 | -4.6 |
| 2 | bq_peaking | 123 | 1.54 | -3.7 |
| 3 | bq_peaking | 382 | 6.0 | -1.5 |
| 4 | bq_peaking | 494 | 0.46 | +4.5 |
| 5 | bq_peaking | 1335 | 1.43 | -6.2 |
| 6 | bq_peaking | 2387 | 6.0 | +2.3 |
| 7 | bq_peaking | 3318 | 3.6 | +5.1 |
| 8 | bq_peaking | 5539 | 3.9 | +4.9 |
| 9 | bq_peaking | 8910 | 1.18 | -5.2 |
| 10 | bq_highshelf | 10000 | 0.7 | -7.0 |

## Liberty 4 NC (Rtings Brüel & Kjær 5128) — MAC: E8:26:CF:83:B9:46

- Preamp: -2.5 dB (not applied in filter-graph; F32LE processing prevents internal clipping)
- 10 bands:

| # | Type | Fc (Hz) | Q | Gain (dB) |
|---|------|---------|------|----------|
| 1 | bq_peaking | 45 | 2.07 | +0.3 |
| 2 | bq_peaking | 71 | 2.62 | -0.3 |
| 3 | bq_lowshelf | 105 | 0.7 | -6.6 |
| 4 | bq_peaking | 105 | 2.1 | -2.1 |
| 5 | bq_peaking | 258 | 1.5 | -0.1 |
| 6 | bq_peaking | 579 | 0.94 | +2.4 |
| 7 | bq_peaking | 1229 | 2.48 | +0.3 |
| 8 | bq_peaking | 4778 | 0.67 | +17.4 |
| 9 | bq_peaking | 5504 | 0.77 | -20.0 |
| 10 | bq_highshelf | 10000 | 0.7 | +2.4 |

Note: Filters 8 and 9 form a steep notch+boost combo around 5 kHz. Net effect is a sharp EQ dip at ~5 kHz.

## Config Files

- Rules: `~/.config/wireplumber/wireplumber.conf.d/52-bt-eq.conf`
- LDAC HQ: `~/.config/wireplumber/wireplumber.conf.d/51-ldac-hq.conf`
- Original EasyEffects presets (backup): `~/.config/backups/pre-audio-eq-setup-20260905-225049/`
- Old filter-chain configs (unused, from node.software-dsp approach): `~/.config/wireplumber/filter-chains/`

## How It Works

- WirePlumber's `filter-graph.lua` matches BT device nodes by `node.name` pattern
- Applies `audioconvert.filter-graph.0` param inline to the audioconvert node
- EQ processed in F32LE (32-bit float) — no clipping risk in DSP
- Automatic: EQ loads on BT connect, removes on disconnect
- Fallback: laptop speaker plays flat (no EQ) when BT disconnected

## Verification Guide

See: `~/.config/wireplumber/filter-chains/VERIFICATION.md`
