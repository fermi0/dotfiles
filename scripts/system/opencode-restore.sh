#!/usr/bin/env bash
set -euo pipefail

MODE=apply
case "${1:-}" in
  "") ;;
  --dry-run) MODE=dry-run ;;
  --check) MODE=check ;;
  --links-only) MODE=links-only ;;
  *) printf 'Usage: %s [--dry-run|--check|--links-only]\n' "$0" >&2; exit 2 ;;
esac

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONFIG_ROOT="$HOME/.config"
OPENCODE_DIR="$CONFIG_ROOT/opencode"
SYSTEMD_DIR="$CONFIG_ROOT/systemd"
SYSTEMD_USER_DIR="$SYSTEMD_DIR/user"
BACKUP_ROOT="${XDG_DATA_HOME:-$HOME/.local/share}/dotfiles-restore-backups"
CHECK_FAILURES=0

say() { printf '\n== %s ==\n' "$*"; }
info() { printf '  %s\n' "$*"; }
warn() { printf '  WARN: %s\n' "$*" >&2; }
fail() { printf '  FAIL: %s\n' "$*" >&2; CHECK_FAILURES=$((CHECK_FAILURES + 1)); }
run() {
  if [[ "$MODE" == dry-run ]]; then
    printf '  DRY:'
    printf ' %q' "$@"
    printf '\n'
  else
    "$@"
  fi
}

same_target() {
  [[ -L "$1" ]] && [[ "$(readlink -f "$1" 2>/dev/null || true)" == "$(readlink -f "$2" 2>/dev/null || true)" ]]
}

backup_target() {
  local target="$1" relative key candidate
  relative="${target#"$HOME"/}"
  key="${relative//\//__}"
  candidate="$BACKUP_ROOT/${key}.pre-restore-$(date +%Y%m%d-%H%M%S%N)"
  while [[ -e "$candidate" || -L "$candidate" ]]; do
    candidate+="-$RANDOM"
  done
  if [[ "$MODE" == dry-run ]]; then
    printf '  DRY: backup %s -> %s\n' "$target" "$candidate"
    return
  fi
  mkdir -p -m 700 "$BACKUP_ROOT"
  mv -- "$target" "$candidate"
  info "backed up: $target -> $candidate"
}

link() {
  local target="$1" source="$2"
  if [[ ! -e "$source" ]]; then
    fail "missing source: $source"
    return
  fi
  if same_target "$target" "$source"; then
    info "ok: $target"
    return
  fi
  if [[ "$MODE" == check ]]; then
    fail "$target does not resolve to $source"
    return
  fi
  if [[ "$MODE" == dry-run ]]; then
    if [[ -e "$target" || -L "$target" ]]; then
      backup_target "$target"
    fi
    printf '  DRY: link %s -> %s\n' "$target" "$source"
    return
  fi
  if [[ -e "$target" || -L "$target" ]]; then
    backup_target "$target"
  fi
  mkdir -p "$(dirname "$target")"
  ln -s "$source" "$target"
  info "linked: $target -> $source"
}

prepare_systemd() {
  if [[ "$MODE" == check ]]; then
    if [[ -L "$SYSTEMD_DIR" ]]; then
      fail "$SYSTEMD_DIR must be a real directory, not a symlink"
    elif [[ ! -d "$SYSTEMD_DIR" ]]; then
      fail "$SYSTEMD_DIR is missing"
    fi
    return
  fi
  if [[ "$MODE" == dry-run ]]; then
    if [[ -L "$SYSTEMD_DIR" ]]; then
      backup_target "$SYSTEMD_DIR"
      printf '  DRY: mkdir -p %s\n' "$SYSTEMD_USER_DIR"
    elif [[ ! -d "$SYSTEMD_DIR" ]]; then
      printf '  DRY: mkdir -p %s\n' "$SYSTEMD_USER_DIR"
    fi
    return
  fi
  if [[ -L "$SYSTEMD_DIR" ]]; then
    backup_target "$SYSTEMD_DIR"
  fi
  mkdir -p "$SYSTEMD_USER_DIR"
}

write_generated() {
  local target="$1" content="$2"
  if [[ -f "$target" ]] && cmp -s <(printf '%s' "$content") "$target"; then
    return
  fi
  if [[ "$MODE" == check ]]; then
    fail "$target is missing or differs from generated content"
    return
  fi
  if [[ "$MODE" == dry-run ]]; then
    if [[ -e "$target" || -L "$target" ]]; then
      backup_target "$target"
    fi
    printf '  DRY: generate %s\n' "$target"
    return
  fi
  if [[ -e "$target" || -L "$target" ]]; then
    backup_target "$target"
  fi
  mkdir -p "$(dirname "$target")"
  printf '%s' "$content" > "$target"
}

scope_id() {
  python3 - "$HOME" <<'PY'
import re, sys
path = sys.argv[1].rstrip("/")
base = re.sub(r"[^a-z0-9]+", "-", path.rsplit("/", 1)[-1].lower()).strip("-") or "workspace"
value = 0xcbf29ce484222325
for byte in path.encode():
    value = ((value ^ byte) * 0x100000001b3) & 0xFFFFFFFFFFFFFFFF
    value &= 0xFFFFFFFFFFFFFFFF
print(f"{base}-{value:016x}"[: len(base) + 1 + 12])
PY
}

cron_to_calendars() {
  python3 - "$1" <<'PY'
import sys
weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
def field(value, low, high):
    if value == "*":
        return None
    output = []
    for part in value.split(","):
        step = 1
        if "/" in part:
            part, raw_step = part.split("/", 1)
            step = int(raw_step)
        if part == "*":
            start, end = low, high
        elif "-" in part:
            start, end = (int(item) for item in part.split("-", 1))
        else:
            start = end = int(part)
        output.extend(range(start, end + 1, step))
    return sorted(set(output))
minute, hour, day, month, weekday = sys.argv[1].split()
minutes = field(minute, 0, 59) or list(range(60))
hours = field(hour, 0, 23) or list(range(24))
days = field(day, 1, 31) or list(range(1, 32))
months = field(month, 1, 12) or list(range(1, 13))
weekdays_value = field(weekday, 0, 7) or list(range(0, 7))
if minute != "*" and hour != "*" and day == "*" and month == "*" and weekday == "*":
    print(f"*-*-* {int(hour):02d}:{int(minute):02d}:00")
    raise SystemExit
entries = []
for current_minute in minutes:
    for current_hour in hours:
        for current_month in months:
            prefixes = [""] if day == "*" and weekday == "*" else weekdays_value
            for current_weekday in prefixes:
                prefix = f"{weekdays[current_weekday % 7]} " if current_weekday != "*" else ""
                for current_day in ([1] if day == "*" and weekday != "*" else days):
                    entries.append(f"{prefix}*-{current_month:02d}-{current_day:02d} {current_hour:02d}:{current_minute:02d}:00")
print("\n".join(entries))
PY
}

link_config_tree() {
  local entry
  local entries=(
    btop cava fastfetch hypr kitty lf nvim oc-local opencode openspec pipewire
    quickshell rofi sheldon swarm-tools swaync wallust waybar wlogout yazi
    wireplumber
  )
  for entry in "${entries[@]}"; do
    link "$CONFIG_ROOT/$entry" "$REPO_ROOT/config/$entry"
  done
  for entry in starship.toml user-dirs.dirs user-dirs.locale mimeapps.list; do
    link "$CONFIG_ROOT/$entry" "$REPO_ROOT/config/$entry"
  done
}

link_user_files() {
  local source zen_profile candidate
  shopt -s nullglob
  for source in "$REPO_ROOT/scripts/llama/"*; do
    [[ -f "$source" && -x "$source" ]] && link "$HOME/.local/bin/${source##*/}" "$source"
  done
  for source in "$REPO_ROOT/scripts/audio/"*; do
    [[ -f "$source" && -x "$source" ]] && link "$HOME/.local/bin/${source##*/}" "$source"
  done
  for source in "$REPO_ROOT/scripts/yazi/"*; do
    [[ -f "$source" && -x "$source" ]] && link "$HOME/.local/bin/${source##*/}" "$source"
  done
  for source in "$REPO_ROOT/scripts/system/lf-paste-progress" "$REPO_ROOT/scripts/system/obsidian-sync"; do
    link "$HOME/.local/bin/${source##*/}" "$source"
  done
  shopt -u nullglob
  if [[ ! -f "$REPO_ROOT/config/zen/prefs.js" ]]; then
    if [[ "$MODE" == check ]]; then
      fail "$REPO_ROOT/config/zen/prefs.js is missing"
    elif [[ "$MODE" == dry-run ]]; then
      printf '  DRY: seed %s from prefs.js.template\n' "$REPO_ROOT/config/zen/prefs.js"
    else
      python3 - "$REPO_ROOT/config/zen/prefs.js.template" "$REPO_ROOT/config/zen/prefs.js" "$HOME" <<'PY'
import pathlib, sys
source, destination, home = sys.argv[1:]
text = pathlib.Path(source).read_text(encoding="utf-8").replace("__HOME__", home)
pathlib.Path(destination).write_text(text, encoding="utf-8")
PY
      chmod 600 "$REPO_ROOT/config/zen/prefs.js"
    fi
  fi
  zen_profile="${ZEN_PROFILE_DIR:-}"
  if [[ -z "$zen_profile" ]]; then
    for candidate in "$HOME"/.zen/*.Default\ \(release\); do
      if [[ -d "$candidate" ]]; then
        zen_profile="$candidate"
        break
      fi
    done
  fi
  if [[ -z "$zen_profile" ]]; then
    warn "no Zen profile found; set ZEN_PROFILE_DIR to restore profile links"
  else
    link "$zen_profile/chrome" "$REPO_ROOT/config/zen/chrome"
    link "$zen_profile/prefs.js" "$REPO_ROOT/config/zen/prefs.js"
  fi
}

link_systemd_files() {
  local source name
  prepare_systemd
  shopt -s nullglob
  for source in "$REPO_ROOT/config/systemd/user/"*.service "$REPO_ROOT/config/systemd/user/"*.timer; do
    name="${source##*/}"
    link "$SYSTEMD_USER_DIR/$name" "$source"
  done
  for source in "$REPO_ROOT/config/systemd/user/"*.service.d; do
    name="${source##*/}"
    link "$SYSTEMD_USER_DIR/$name" "$source"
  done
  shopt -u nullglob
  link "$SYSTEMD_USER_DIR/default.target.wants/pipewire.service" "/usr/lib/systemd/user/pipewire.service"
  link "$SYSTEMD_USER_DIR/pipewire.service.wants/wireplumber.service" "/usr/lib/systemd/user/wireplumber.service"
  link "$SYSTEMD_USER_DIR/sockets.target.wants/pipewire.socket" "/usr/lib/systemd/user/pipewire.socket"
  link "$SYSTEMD_USER_DIR/sockets.target.wants/pipewire-pulse.socket" "/usr/lib/systemd/user/pipewire-pulse.socket"
  link "$SYSTEMD_USER_DIR/graphical-session.target.wants/hyprpolkitagent.service" "/usr/lib/systemd/user/hyprpolkitagent.service"
}

bootstrap_secrets() {
  if [[ ! -f "$HOME/.env.local" ]]; then
    if [[ "$MODE" == check ]]; then
      fail "$HOME/.env.local is missing"
    else
      run cp "$REPO_ROOT/config/opencode/env.example" "$HOME/.env.local"
      run chmod 600 "$HOME/.env.local"
    fi
  else
    info "ok: $HOME/.env.local"
    if [[ "$MODE" == check ]]; then
      [[ "$(stat -c '%a' "$HOME/.env.local")" == 600 ]] || fail "$HOME/.env.local must be mode 600"
    else
      run chmod 600 "$HOME/.env.local"
    fi
  fi
  if [[ ! -f "$OPENCODE_DIR/opencode-poorguy-ratelimit.jsonc" ]]; then
    if [[ "$MODE" == check ]]; then
      fail "$OPENCODE_DIR/opencode-poorguy-ratelimit.jsonc is missing"
    else
      run cp "$OPENCODE_DIR/opencode-poorguy-ratelimit.jsonc.example" "$OPENCODE_DIR/opencode-poorguy-ratelimit.jsonc"
      run chmod 600 "$OPENCODE_DIR/opencode-poorguy-ratelimit.jsonc"
    fi
  else
    info "ok: $OPENCODE_DIR/opencode-poorguy-ratelimit.jsonc"
    if [[ "$MODE" == check ]]; then
      [[ "$(stat -c '%a' "$OPENCODE_DIR/opencode-poorguy-ratelimit.jsonc")" == 600 ]] || fail "$OPENCODE_DIR/opencode-poorguy-ratelimit.jsonc must be mode 600"
    else
      run chmod 600 "$OPENCODE_DIR/opencode-poorguy-ratelimit.jsonc"
    fi
  fi
}

install_dependencies() {
  if ! command -v npm >/dev/null; then
    warn "npm missing; dependency installation skipped"
    return
  fi
  if [[ "$MODE" == check ]]; then
    for directory in "$OPENCODE_DIR/node_modules" "$REPO_ROOT/config/oc-local/opencode/node_modules" "$OPENCODE_DIR/plugins/opencode-token-optimizer/node_modules"; do
      [[ -d "$directory" ]] || fail "$directory is missing"
    done
    node --check "$OPENCODE_DIR/plugins/opencode-auto-free/index.js" || fail "opencode-auto-free syntax check failed"
    return
  fi
  if [[ -f "$OPENCODE_DIR/package-lock.json" ]]; then
    run npm --prefix "$OPENCODE_DIR" ci --no-audit --no-fund
  else
    warn "opencode package-lock.json missing"
  fi
  if [[ -f "$REPO_ROOT/config/oc-local/opencode/package-lock.json" ]]; then
    run npm --prefix "$REPO_ROOT/config/oc-local/opencode" ci --no-audit --no-fund
  fi
  if [[ -f "$OPENCODE_DIR/plugins/opencode-token-optimizer/package.json" ]]; then
    run npm --prefix "$OPENCODE_DIR/plugins/opencode-token-optimizer" ci --no-audit --no-fund
    run npm --prefix "$OPENCODE_DIR/plugins/opencode-token-optimizer" run build
  else
    warn "token optimizer package.json missing"
  fi
  if [[ ! -f "$OPENCODE_DIR/plugins/opencode-auto-free/index.js" ]]; then
    fail "opencode-auto-free/index.js missing"
  else
    run node --check "$OPENCODE_DIR/plugins/opencode-auto-free/index.js"
  fi
}

restore_scheduler() {
  local template slug name cron destination unit calendars service_content timer_content
  local templates=()
  shopt -s nullglob
  templates=("$REPO_ROOT/config/opencode/scheduler-templates/"*.json)
  shopt -u nullglob
  if [[ ${#templates[@]} -eq 0 ]]; then
    warn "no scheduler templates found"
    return
  fi
  for template in "${templates[@]}"; do
    slug="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["slug"])' "$template")"
    name="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["name"])' "$template")"
    cron="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["schedule"])' "$template")"
    destination="$OPENCODE_DIR/scheduler/scopes/$SCOPE_ID/jobs/$slug.json"
    if [[ "$MODE" == check ]]; then
      [[ -f "$destination" ]] || fail "$destination is missing"
    elif [[ "$MODE" == dry-run ]]; then
      printf '  DRY: generate %s\n' "$destination"
    else
      mkdir -p "$(dirname "$destination")"
      python3 - "$template" "$destination" "$HOME" "$REPO_ROOT" "$SCOPE_ID" <<'PY'
import json, os, sys
source, destination, home, repo, scope = sys.argv[1:]
with open(source, encoding="utf-8") as handle:
    job = json.load(handle)
job["scopeId"] = scope
job["workdir"] = home
job["invocation"]["args"] = [value.replace("__REPO_ROOT__", repo) for value in job["invocation"]["args"]]
for key in ["lastRunAt", "lastRunExitCode", "lastRunSource", "lastRunStatus", "updatedAt"]:
    job.pop(key, None)
temporary = destination + ".tmp"
with open(temporary, "w", encoding="utf-8") as handle:
    json.dump(job, handle, separators=(",", ":"))
    handle.write("\n")
os.replace(temporary, destination)
PY
    fi
    unit="opencode-job-$SCOPE_ID-$slug"
    calendars="$(cron_to_calendars "$cron")"
    printf -v service_content '[Unit]\nDescription=OpenCode Job: %s\n\n[Service]\nType=oneshot\nWorkingDirectory=%%h\nEnvironment="PATH=/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"\nExecStart="/usr/bin/perl" "%%h/.config/opencode/scheduler/supervisor.pl" "%%h/.config/opencode/scheduler/scopes/%s/jobs/%s.json"\nStandardOutput=append:%%h/.config/opencode/logs/scheduler/%s/%s.log\nStandardError=append:%%h/.config/opencode/logs/scheduler/%s/%s.log\n\n[Install]\nWantedBy=default.target\n' "$name" "$SCOPE_ID" "$slug" "$SCOPE_ID" "$slug" "$SCOPE_ID" "$slug"
    printf -v timer_content '[Unit]\nDescription=Timer for OpenCode Job: %s\n\n[Timer]\n%s\nPersistent=true\n\n[Install]\nWantedBy=timers.target\n' "$name" "$(printf '%s' "$calendars" | sed 's/^/OnCalendar=/')"
    write_generated "$SYSTEMD_USER_DIR/$unit.service" "$service_content"
    write_generated "$SYSTEMD_USER_DIR/$unit.timer" "$timer_content"
  done
}

enable_services() {
  local unit timer
  local units=(
    openscq30-watchdog.service
    searxng.service
    swaync.service
    zurnel-vault-commit.timer
    zurnel-vault-stable.timer
  )
  shopt -s nullglob
  for timer in "$SYSTEMD_USER_DIR/opencode-job-$SCOPE_ID-"*.timer; do
    units+=("${timer##*/}")
  done
  shopt -u nullglob
  if ! command -v systemctl >/dev/null; then
    warn "systemctl missing; unit activation skipped"
    return
  fi
  if [[ "$MODE" == check ]]; then
    if command -v systemd-analyze >/dev/null; then
      systemd-analyze --user verify "$SYSTEMD_USER_DIR"/*.service "$SYSTEMD_USER_DIR"/*.timer || fail "systemd unit verification failed"
    fi
  else
    run systemctl --user daemon-reload
  fi
  for unit in "${units[@]}"; do
    if [[ "$MODE" == check ]]; then
      systemctl --user is-enabled --quiet "$unit" || fail "$unit is not enabled"
      systemctl --user is-active --quiet "$unit" || fail "$unit is not active"
    else
      run systemctl --user enable --now "$unit"
    fi
  done
}

say "Prerequisites"
for command_name in git python3; do
  command -v "$command_name" >/dev/null || fail "$command_name missing"
done
for command_name in npm node systemctl; do
  command -v "$command_name" >/dev/null || warn "$command_name missing"
done
info "repo: $REPO_ROOT"
info "home: $HOME"
info "mode: $MODE"

SCOPE_ID="$(scope_id)"
say "Managed links"
link "$HOME/.agents" "$REPO_ROOT/agents"
link "$HOME/.aliasrc" "$REPO_ROOT/.aliasrc"
link "$HOME/.zshrc" "$REPO_ROOT/.zshrc"
link "$HOME/scripts" "$REPO_ROOT/scripts"
link_config_tree
link_user_files

say "User systemd"
link_systemd_files

if [[ "$MODE" != links-only ]]; then
  say "Secrets"
  bootstrap_secrets
  say "Dependencies"
  install_dependencies
  say "Scheduler"
  restore_scheduler
fi

say "Activation"
enable_services

if [[ "$MODE" == check ]]; then
  if [[ "$CHECK_FAILURES" -ne 0 ]]; then
    printf '\ncheck failed: %d issue(s)\n' "$CHECK_FAILURES" >&2
    exit 1
  fi
  printf '\ncheck passed\n'
  exit 0
fi

say "Next steps"
printf '  1. Fill secrets in %s and %s\n' "$HOME/.env.local" "$OPENCODE_DIR/opencode-poorguy-ratelimit.jsonc"
printf '  2. Run: opencode debug config && plugin_health\n'
printf '  3. Run: systemctl --user --failed\n'
printf '  4. Review %s before deleting old recovery material\n' "$BACKUP_ROOT"
