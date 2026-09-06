# Soundcore AutoEQ Presets Backup

created: 2026-09-05

## Source
Original presets from EasyEffects (oratory1990 + RTINGS Brüel & Kjær), converted to PipeWire filter-chain format.

## Space One (oratory1990) — MAC: F4:9D:8A:1C:BE:F6
- Input gain: -4.7 dB (not applied in filter-chain; F32LE processing prevents clipping)
- 10 bands:

| Band | Type | Freq (Hz) | Gain (dB) | Q |
|------|------|-----------|-----------|---|
| 0 | bq_lowshelf | 105 | -4.6 | 0.7 |
| 1 | bq_peaking | 494 | +4.5 | 0.46 |
| 2 | bq_peaking | 1335 | -6.2 | 1.43 |
| 3 | bq_peaking | 123 | -3.7 | 1.54 |
| 4 | bq_peaking | 3318 | +5.1 | 3.6 |
| 5 | bq_highshelf | 10000 | -7.0 | 0.7 |
| 6 | bq_peaking | 8910 | -5.2 | 1.18 |
| 7 | bq_peaking | 5539 | +4.9 | 3.9 |
| 8 | bq_peaking | 2387 | +2.3 | 6.0 |
| 9 | bq_peaking | 382 | -1.5 | 6.0 |

## Liberty 4 NC (RTINGS Brüel & Kjær) — MAC: E8:26:CF:83:B9:46
- Input gain: -3.6 dB (not applied in filter-chain; F32LE processing prevents clipping)
- 10 bands:

| Band | Type | Freq (Hz) | Gain (dB) | Q |
|------|------|-----------|-----------|---|
| 0 | bq_lowshelf | 105 | -1.6 | 0.7 |
| 1 | bq_peaking | 2383 | +4.0 | 0.26 |
| 2 | bq_peaking | 79 | -4.7 | 0.79 |
| 3 | bq_peaking | 264 | -1.8 | 0.35 |
| 4 | bq_peaking | 7369 | -6.0 | 1.88 |
| 5 | bq_highshelf | 10000 | -3.0 | 0.7 |
| 6 | bq_peaking | 4874 | +1.1 | 3.01 |
| 7 | bq_peaking | 2945 | -1.0 | 3.83 |
| 8 | bq_peaking | 89 | -1.0 | 6.0 |
| 9 | bq_peaking | 8013 | +1.3 | 5.99 |

## Config Files
- Rules: `~/.config/wireplumber/wireplumber.conf.d/52-bt-eq.conf`
- LDAC HQ: `~/.config/wireplumber/wireplumber.conf.d/51-ldac-hq.conf`
- Filter-chain configs (backup, not used): `~/.config/wireplumber/filter-chains/`
- Original EasyEffects presets: `~/.config/backups/pre-audio-eq-setup-20260905-225049/`

## How It Works
- WirePlumber's `filter-graph.lua` script matches BT device nodes by `node.name` pattern
- Applies `audioconvert.filter-graph.0` param inline to the audioconvert node
- EQ processed in F32LE (32-bit float) — no clipping risk in DSP
- Automatic: EQ loads on BT connect, removes on disconnect
- Fallback: laptop speaker plays flat (no EQ) when BT disconnected
