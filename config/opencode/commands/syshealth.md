---
description: System health audit — one-page report of load, memory, swap, disk, services, GPU/LLM, and errors. Use when asked for a system/health/status check or before troubleshooting.
agent: build
---

Run a read-only system health audit and produce a concise one-page report. Do NOT modify anything.

Gather facts with bash (no sudo, all read-only):
- Uptime and load: `uptime`
- Memory: `free -h`
- Swap: `swapon --show`
- Disk: `df -h / /home`
- Top memory and CPU consumers: `ps -eo pid,comm,%mem,%cpu --sort=-%mem | head -12`
- Failed systemd units: `systemctl --failed --no-pager`
- High-priority errors last 24h: `journalctl -p err --since "24 hours ago" --no-pager | tail -30`
- GPU and llama-server VRAM: `nvidia-smi`
- Recent core dumps: `ls -lt /var/lib/systemd/coredump 2>/dev/null | head -5`
- Temperatures if sensors exist: `sensors 2>/dev/null`
- Network if relevant: `ip -br a 2>/dev/null`

Emit a SHORT report with bullets under [Uptime/Load], [Memory], [Swap], [Disk], [Top processes],
[Services], [GPU/LLM], [Errors 24h]. For each section flag anything abnormal (disk >80%, swap in use,
OOM/kernel traces, failed units, high temperature, GPU <1 GB free) with a one-line fix.

Never speculate; if a metric cannot be read, say "unavailable" and move on. If the user passed
$ARGUMENTS, focus the report on only those components.