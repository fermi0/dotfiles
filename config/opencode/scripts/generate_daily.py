#!/usr/bin/env python3
"""
Evidence-Based Daily Planning Generator
Generates daily note with motivation, MITs, habit stack, ultradian 90/20, Three Good Things, consistency chain.
"""

import os
import sys
import argparse
from datetime import datetime, timedelta
from pathlib import Path
import subprocess
import json

# Configuration
DAILY_DIR = Path.home() / "Work" / "daily"
ZURNEL_VAULT = Path.home() / "Work" / "Zurnel"
TIMEZONE = "Asia/Kathmandu"
USER_UID = os.getuid()

# Motivational quotes (SDT-based: Autonomy, Competence, Relatedness)
MOTIVATION_QUOTES = [
    '"Showing up counts" — after 21 days, 66-day habit (Lally et al., 2010)',
    '"Progress over perfection" — consistency beats intensity (Clear, Atomic Habits)',
    '"The best time to plant a tree was 20 years ago. The second best time is now."',
    '"Small daily improvements lead to staggering results" — 1% better daily = 37x yearly',
    '"Discipline equals freedom" — structure enables autonomy (Jocko Willink)',
    '"You do not rise to the level of your goals. You fall to the level of your systems." — James Clear',
    '"Motivation is fleeting. Systems are reliable."',
    '"The compound effect of small habits creates exponential results."',
]

def get_date_str(date_offset=0):
    """Get date string in YYYY-MM-DD format with optional offset."""
    target_date = datetime.now() + timedelta(days=date_offset)
    return target_date.strftime("%Y-%m-%d")

def get_streak_count():
    """Calculate current streak by checking consecutive daily notes."""
    streak = 0
    current_date = datetime.now()
    
    while True:
        date_str = current_date.strftime("%Y-%m-%d")
        daily_file = DAILY_DIR / f"{date_str}.md"
        if daily_file.exists():
            streak += 1
            current_date -= timedelta(days=1)
        else:
            break
    return streak

def get_motivation_quote():
    """Get a motivational quote for the day."""
    import random
    return random.choice(MOTIVATION_QUOTES)

def generate_daily_note(date_str=None, project="zurnel-saas"):
    """Generate the daily note content."""
    if date_str is None:
        date_str = get_date_str()
    
    streak = get_streak_count()
    motivation = get_motivation_quote()
    
    # Parse date for display
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    formatted_date = date_obj.strftime("%Y-%m-%d")
    day_name = date_obj.strftime("%A")
    
    content = f"""---
tags:
  - daily
  - MIT
  - consistency
streak: {streak}
vault: "[[Zurnel]]"
date: {formatted_date}
project: {project}
created: {datetime.now().isoformat()}
modified: {datetime.now().isoformat()}
---

# Daily {formatted_date} — Kathmandu VAT SaaS + Zurnel ({day_name})

## Motivation (SDT — Autonomy/Competence/Relatedness)
> {motivation}

## MITs (Eisenhower, 1-3, Implementation Intentions Gollwitzer d=0.65)
- [ ] **MIT 1:** When [after breakfast 08:00 Asia/Kathmandu], I will [validate 10 CBMS invoices via `zurnel-saas` POST /api/invoices → GET /api/stats]
- [ ] **MIT 2:** After MIT 1, I will [run `npx playwright test e2e --reporter=list` + `mmdc` render for VAT dashboard]
- [ ] **Habit Stack:** After [MIT 1], I will [review `~/shared/Zurnel` inbox 5m via `Janitor` orphan scan + `Linter`]

## Ultradian 90/20 (Deep) + 25/5 (Shallow)
- **Deep 90m:** 08:00-09:30 (P3.3/P3.4 zurnel-saas scaffold — Vite 320ms, Hono 12KB, drizzle WAL)
- **Shallow 25m:** 10:00-10:25 (P3.5 report → pandoc self-contained HTML)
- **Break 20m:** `swaync` + `notify-send "MIT 1 done" "Reward: showing up"`

## Self-Development (Spaced Repetition Dunlosky d=0.62, 10-20% gap)
- Review `phase3brainstorm-output.md` §2.2 Robust vs Mentor matrix (Qwen 9B 80% + Gemma 26B 20%)

## Mind / Personality (Behavior Graph, Not MBTI)
- Mind: `Smart Connections` offline embeddings → find related `Zurnel/reports/kathmandu-vat-saas` + `zurnel-saas` stats
- Personality: Track `streak:: {streak}` via `Tracker` velocity, not trait quiz

## Three Good Things (Seligman, 1-3x/week, 21:00)
- [ ] CBMS validator tests pass
- [ ] VAT lottery QR math (Rs100+ → Rs1L net)
- [ ] Vault plugins audit → gaps identified

## Incremental Progress + Consistency (Heatmap + never-miss-twice)
- **Heatmap:** `{formatted_date}` streak {streak} (github-style year)
- **Kanban:** `MITs / Doing / Done` WIP 1-3
- **Never miss twice:** If miss today, `Periodic Notes` rolls `TASK WHERE !completed` to `{(date_obj + timedelta(days=1)).strftime("%Y-%m-%d")}`

## Prediction (Time MCP Asia/Kathmandu + Weekly Review)
- Tomorrow `{(date_obj + timedelta(days=1)).strftime("%Y-%m-%d")}` will be {'Weekly Review' if date_obj.weekday() == 6 else 'Regular Day'} via `scheduler` {'Sunday 18:00' if date_obj.weekday() == 6 else '07:00'}

## Links (Cross-Domain P3.7 Proof)
- [[Zurnel/reports/kathmandu-vat-saas-{formatted_date}|VAT SaaS Report]] (P3.5)
- [[Zurnel/daily/{formatted_date}|Today]] + `zurnel-saas` SaaS slice (P3.3/P3.4)
- `Bases` dashboard: `TABLE streak FROM "daily" WHERE date = {formatted_date}`

---
*Generated via `/daily` (with-context + Templater 2.7.3 + Dataview + Heatmap 0.7.1 + swaync 0.12.6) — evidence-based only (no MBTI/manifestation). Scheduler timer `0 7 * * *` reboot-proof via `opencode-scheduler` systemd.*
"""
    return content

def write_daily_note(date_str=None, project="zurnel-saas"):
    """Write the daily note to the daily directory."""
    if date_str is None:
        date_str = get_date_str()
    
    DAILY_DIR.mkdir(parents=True, exist_ok=True)
    
    daily_file = DAILY_DIR / f"{date_str}.md"
    content = generate_daily_note(date_str, project)
    
    daily_file.write_text(content)
    print(f"✓ Daily note created: {daily_file}")
    
    # Also copy to Zurnel vault daily folder for cross-linking
    zurnel_daily = ZURNEL_VAULT / "daily"
    zurnel_daily.mkdir(parents=True, exist_ok=True)
    zurnel_file = zurnel_daily / f"{date_str}.md"
    zurnel_file.write_text(content)
    print(f"✓ Daily note copied to vault: {zurnel_file}")
    
    return daily_file

def schedule_evening_notification(date_str=None):
    """Schedule evening notification for Three Good Things reflection at 21:00."""
    if date_str is None:
        date_str = get_date_str()
    
    # Create a systemd user timer for 21:00 today
    timer_content = f"""[Unit]
Description=Daily Evening Reflection - Three Good Things ({date_str})

[Timer]
OnCalendar=*-*-* 21:00:00
Persistent=true
AccuracySec=1min

[Install]
WantedBy=timers.target
"""
    
    service_content = f"""[Unit]
Description=Evening Reflection Notification

[Service]
Type=oneshot
ExecStart=/usr/bin/notify-send "🌅 Evening Reflection (21:00)" "Three Good Things time! Reflect on: 1) What went well? 2) What did I learn? 3) What am I grateful for? — Streak: {get_streak_count()}"
Environment=DISPLAY=:0
Environment=DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/{USER_UID}/bus

[Install]
WantedBy=default.target
"""
    
    # Write timer and service files
    timer_dir = Path.home() / ".config" / "systemd" / "user"
    timer_dir.mkdir(parents=True, exist_ok=True)
    
    timer_file = timer_dir / f"daily-reflection-{date_str}.timer"
    service_file = timer_dir / f"daily-reflection-{date_str}.service"
    
    timer_file.write_text(timer_content)
    service_file.write_text(service_content)
    
    # Enable and start the timer
    try:
        subprocess.run(["systemctl", "--user", "daemon-reload"], check=True)
        subprocess.run(["systemctl", "--user", "enable", "--now", f"daily-reflection-{date_str}.timer"], check=True)
        print(f"✓ Evening reflection notification scheduled for 21:00")
    except subprocess.CalledProcessError as e:
        print(f"⚠ Could not schedule notification: {e}")

def main():
    parser = argparse.ArgumentParser(description="Generate evidence-based daily plan")
    parser.add_argument("date", nargs="?", help="Date in YYYY-MM-DD format (default: today)")
    parser.add_argument("--project", default="zurnel-saas", help="Project name")
    parser.add_argument("--notify", action="store_true", help="Schedule evening notification")
    parser.add_argument("--dry-run", action="store_true", help="Print content without writing")
    
    args = parser.parse_args()
    
    date_str = args.date if args.date else get_date_str()
    
    # Validate date format
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        print(f"Error: Invalid date format. Use YYYY-MM-DD")
        sys.exit(1)
    
    if args.dry_run:
        content = generate_daily_note(date_str, args.project)
        print(content)
    else:
        write_daily_note(date_str, args.project)
        if args.notify:
            schedule_evening_notification(date_str)
        
        # Send immediate notification that daily note is ready
        try:
            subprocess.run([
                "notify-send", 
                "📅 Daily Plan Ready", 
                f"Daily note for {date_str} generated. Streak: {get_streak_count()}"
            ], check=False)
        except:
            pass

if __name__ == "__main__":
    main()