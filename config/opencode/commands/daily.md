---
name: daily
description: Generate evidence-based daily plan via Python script
agent: build
---

# /daily — Evidence-Based Daily Planning (P3.6)

**CRITICAL: Execute the Python script directly using bash. Do NOT generate content manually.**

## MANDATORY EXECUTION

Run this exact command (replace args as needed):

```bash
/home/work/.config/opencode/scripts/generate_daily.py 2026-08-30 --notify
```

**For today:** `/home/work/.config/opencode/scripts/generate_daily.py --notify`
**For specific date:** `/home/work/.config/opencode/scripts/generate_daily.py 2026-08-30 --notify`
**Dry run:** `/home/work/.config/opencode/scripts/generate_daily.py --dry-run`

## What the script does

Generates daily note with all evidence-based components:
- YAML frontmatter (tags, streak, vault link, date, project)
- Motivation (SDT quote)
- MITs as implementation intentions (Gollwitzer d=0.65)
- Habit stack (Fogg B=MAP)
- Ultradian 90/20 schedule
- Three Good Things (Seligman) at 21:00
- Consistency tracking (streak, Heatmap, Kanban, never-miss-twice)
- Cross-domain links (Zurnel, Bases, VAT SaaS)

Writes to `~/Work/daily/YYYY-MM-DD.md` AND `~/Work/Zurnel/daily/YYYY-MM-DD.md`.

With `--notify`: Creates systemd timer for 21:00 `notify-send` reflection.

## Verification (run after)

```bash
ls ~/Work/daily/2026-08-30.md ~/Work/Zurnel/daily/2026-08-30.md
cat ~/Work/daily/2026-08-30.md | head -40
systemctl --user list-timers | grep daily-reflection
```