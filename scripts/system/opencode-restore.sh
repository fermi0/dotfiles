#!/usr/bin/env bash
# opencode-restore.sh — restore the OpenCode stack from this dotfiles repo onto any machine.
#
# Works from ANY clone location and ANY username (no stow; plain symlinks).
# Idempotent: safe to re-run. Existing files are backed up, never deleted.
#
# Usage:
#   scripts/system/opencode-restore.sh            # apply
#   scripts/system/opencode-restore.sh --dry-run  # show actions only
#
# What it does:
#   1. Symlinks repo configs into ~/.config, ~/.agents, ~/.zshrc, ~/scripts, ~/.local/bin
#   2. Rewrites hardcoded /home/work + /home/shared/dotfiles paths if this machine differs
#   3. Bootstraps secrets from *.example templates (fill in keys afterwards)
#   4. npm ci for opencode + oc-local + token-optimizer build
#   5. Recreates scheduler jobs in the local scope + systemd user timers
#
# Not handled here (see printed next steps): opencode binary, searxng/llama.cpp apps,
# Obsidian REST cert, playwright browsers, global npm CLIs, API keys.

set -euo pipefail

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONFIG_DIR="$HOME/.config/opencode"
OLD_HOME="/home/work"
OLD_REPO="/home/shared/dotfiles"

say()  { printf '\n\033[1m== %s ==\033[0m\n' "$*"; }
info() { printf '  %s\n' "$*"; }
warn() { printf '  WARN: %s\n' "$*" >&2; }
run()  { if (( DRY_RUN )); then printf '  DRY: %s\n' "$*"; else "$@"; fi; }

# ── 0. Prereq check ────────────────────────────────────────────────────────────
say "Prereqs"
for cmd in git python3; do
  if ! command -v "$cmd" >/dev/null; then
    warn "$cmd not found — required"; MISSING=1
  fi
done
[[ -n "${MISSING:-}" ]] && { echo "Install missing prereqs first."; exit 1; }
for cmd in npm bun opencode systemctl; do
  command -v "$cmd" >/dev/null || warn "$cmd not found — some steps will be skipped"
done
info "repo: $REPO_ROOT"
info "home: $HOME"

# ── 1. Symlinks ────────────────────────────────────────────────────────────────
# link <target> <source>: backup existing, then symlink (idempotent).
link() {
  local target="$1" source="$2"
  # Already the same file (e.g. reached via a parent-dir symlink)? Skip.
  if [[ "$(readlink -f "$target" 2>/dev/null)" == "$(readlink -f "$source" 2>/dev/null)" ]]; then
    info "ok: $target"
    return
  fi
  if [[ -L "$target" ]]; then
    run mv "$target" "$target.pre-opencode-restore.bak"
  elif [[ -e "$target" ]]; then
    run mv "$target" "$target.pre-opencode-restore.bak"
    info "backed up: $target"
  fi
  run mkdir -p "$(dirname "$target")"
  run ln -s "$source" "$target"
  info "linked: $target -> $source"
}

say "Symlinks"
link "$HOME/.config/opencode" "$REPO_ROOT/config/opencode"
link "$HOME/.config/oc-local" "$REPO_ROOT/config/oc-local"
link "$HOME/.agents"          "$REPO_ROOT/agents"
link "$HOME/.zshrc"           "$REPO_ROOT/.zshrc"
link "$HOME/.aliasrc"         "$REPO_ROOT/.aliasrc"
link "$HOME/scripts"          "$REPO_ROOT/scripts"

for s in llama-serve llama-warmup llama-save-slots llama-build-cuda; do
  link "$HOME/.local/bin/$s" "$REPO_ROOT/scripts/llama/$s"
done

# systemd user units: link individual files so an existing ~/.config/systemd stays intact
for u in searxng.service "llama-server@.service"; do
  link "$HOME/.config/systemd/user/$u" "$REPO_ROOT/config/systemd/user/$u"
done
link "$HOME/.config/systemd/user/llama-server@.service.d/override.conf" \
     "$REPO_ROOT/config/systemd/user/llama-server@.service.d/override.conf"

# ── 2. Path rewrite (different username / clone location) ─────────────────────
say "Path rewrite"
if [[ "$HOME" == "$OLD_HOME" && "$REPO_ROOT" == "$OLD_REPO" ]]; then
  info "not needed (paths already match)"
else
  FILES=(
    "$REPO_ROOT/config/opencode/opencode.jsonc"
    "$REPO_ROOT/config/opencode/tui.json"
    "$REPO_ROOT/config/oc-local/opencode/opencode.jsonc"
    "$REPO_ROOT/config/oc-local/opencode/tui.json"
  )
  for f in "${FILES[@]}"; do
    [[ -f "$f" ]] || continue
    if grep -qE "$OLD_HOME|$OLD_REPO" "$f"; then
      run sed -i "s|$OLD_REPO|$REPO_ROOT|g; s|$OLD_HOME|$HOME|g" "$f"
      info "rewrote: ${f#"$REPO_ROOT"/}"
    fi
  done
  warn "rewrites modify tracked files (expected: deployment copy is now machine-specific)"
fi

# ── 3. Secrets bootstrap ───────────────────────────────────────────────────────
say "Secrets bootstrap"
if [[ ! -f "$HOME/.env.local" ]]; then
  run cp "$REPO_ROOT/config/opencode/env.example" "$HOME/.env.local"
  run chmod 600 "$HOME/.env.local"
  warn "created ~/.env.local from env.example — FILL IN YOUR API KEYS"
else
  info "ok: ~/.env.local exists"
fi
if [[ ! -f "$CONFIG_DIR/opencode-poorguy-ratelimit.jsonc" ]]; then
  run cp "$CONFIG_DIR/opencode-poorguy-ratelimit.jsonc.example" \
         "$CONFIG_DIR/opencode-poorguy-ratelimit.jsonc"
  warn "created opencode-poorguy-ratelimit.jsonc — FILL IN ROTATION KEYS"
else
  info "ok: opencode-poorguy-ratelimit.jsonc exists"
fi

# ── 4. Dependencies ────────────────────────────────────────────────────────────
say "Dependencies"
if command -v npm >/dev/null; then
  if [[ -f "$CONFIG_DIR/package-lock.json" ]]; then
    run bash -c "cd '$CONFIG_DIR' && npm ci --no-audit --no-fund"
  else
    warn "no package-lock.json in opencode config — run npm install manually"
  fi
  if [[ -f "$REPO_ROOT/config/oc-local/opencode/package-lock.json" ]]; then
    run bash -c "cd '$REPO_ROOT/config/oc-local/opencode' && npm ci --no-audit --no-fund"
  fi
  TO="$CONFIG_DIR/plugins/opencode-token-optimizer"
  if [[ -f "$TO/package.json" ]]; then
    run bash -c "cd '$TO' && npm ci --no-audit --no-fund && npm run build"
  else
    warn "token-optimizer package.json missing — cannot rebuild dist/"
  fi
else
  warn "npm missing — install fnm/node first (see next steps), then re-run"
fi

# ── 5. Scheduler jobs + systemd timers ────────────────────────────────────────
say "Scheduler"

scope_id="$(python3 - "$HOME" <<'PY'
import re, sys
p = sys.argv[1].rstrip("/")
base = re.sub(r"[^a-z0-9]+", "-", p.rsplit("/", 1)[-1].lower()).strip("-") or "workspace"
h = 0xcbf29ce484222325
for b in p.encode():
    h = ((h ^ b) * 0x100000001b3) & 0xFFFFFFFFFFFFFFFF
print(f"{base}-{h:016x}"[: len(base) + 1 + 12])
PY
)"
info "scope: $scope_id (workdir $HOME)"

SCOPES_DIR="$CONFIG_DIR/scheduler/scopes"
SRC_JOBS_DIR="$(dirname "$(find "$CONFIG_DIR/scheduler/scopes" -path '*/jobs/nepal-daily-news-scan.json' | head -1)")"
JOBS_DIR="$SCOPES_DIR/$scope_id/jobs"
run mkdir -p "$JOBS_DIR" "$SCOPES_DIR/$scope_id/locks" "$SCOPES_DIR/$scope_id/runs" \
            "$CONFIG_DIR/logs/scheduler/$scope_id" "$HOME/.config/systemd/user"

cron_to_calendars() {
  python3 - "$1" <<'PY'
import sys
WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
def field(f, lo, hi):
    if f == "*": return None
    out = []
    for part in f.split(","):
        step = 1
        if "/" in part:
            part, s = part.split("/", 1); step = int(s)
        if part == "*": a, b = lo, hi
        elif "-" in part: a, b = (int(x) for x in part.split("-", 1))
        else: a = b = int(part)
        out += list(range(a, b + 1, step))
    return sorted(set(out))
m, h, dom, mon, dow = sys.argv[1].split()
mv = field(m, 0, 59); hv = field(h, 0, 23)
days_raw = field(dom, 1, 31); wd_raw = field(dow, 0, 7); mon_raw = field(mon, 1, 12)
mins = [f"{v:02d}" for v in mv] if mv else ["*"]
hrs  = [f"{v:02d}" for v in hv] if hv else ["*"]
days = [f"{v:02d}" for v in days_raw] if days_raw else ["*"]
mons = [f"{v:02d}" for v in mon_raw] if mon_raw else ["*"]
wds  = [WD[v % 7] for v in wd_raw] if wd_raw else ["*"]
cals = []
def build(ds, ws):
    for mi in mins:
        for hh in hrs:
            for dd in ds:
                for mm in mons:
                    for ww in ws:
                        prefix = f"{ww} " if ww != "*" else ""
                        cals.append(f"{prefix}*-{mm}-{dd} {hh}:{mi}:00")
if days_raw and wd_raw:
    build(days, ["*"]); build(["*"], wds)
else:
    build(days, wds)
print("\n".join(cals))
PY
}

shopt -s nullglob
for src in "$SRC_JOBS_DIR"/*.json; do
  slug="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["slug"])' "$src")"
  name="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["name"])' "$src")"
  cron="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["schedule"])' "$src")"
  dest="$JOBS_DIR/$slug.json"

  if (( DRY_RUN )); then
    info "DRY: rewrite+copy $slug.json -> scope $scope_id"
  else
    python3 - "$src" "$dest" "$OLD_REPO" "$REPO_ROOT" "$OLD_HOME" "$HOME" "$scope_id" <<'PY'
import json, sys
src, dest, oldrepo, newrepo, oldhome, newhome, scope = sys.argv[1:8]
job = json.load(open(src))
s = json.dumps(job).replace(oldrepo, newrepo).replace(oldhome, newhome)
job = json.loads(s)
job["scopeId"] = scope
job["workdir"] = newhome
open(dest, "w").write(json.dumps(job, separators=(",", ":")) + "\n")
PY
  fi
  info "job: $slug ($cron)"

  unit="opencode-job-$scope_id-$slug"
  calendars="$(cron_to_calendars "$cron")"
  if (( DRY_RUN )); then
    info "DRY: write $unit.service + $unit.timer"
  else
    {
      printf '[Unit]\nDescription=OpenCode Job: %s\n\n[Service]\nType=oneshot\n' "$name"
      printf 'WorkingDirectory=%s\n' "$HOME"
      printf 'Environment="PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"\n'
      printf 'ExecStart="/usr/bin/perl" "%s" "%s"\n' \
        "$CONFIG_DIR/scheduler/supervisor.pl" "$dest"
      printf 'StandardOutput=append:%s/logs/scheduler/%s/%s.log\n' "$CONFIG_DIR" "$scope_id" "$slug"
      printf 'StandardError=append:%s/logs/scheduler/%s/%s.log\n\n' "$CONFIG_DIR" "$scope_id" "$slug"
      printf '[Install]\nWantedBy=default.target\n'
    } > "$HOME/.config/systemd/user/$unit.service"
    {
      printf '[Unit]\nDescription=Timer for OpenCode Job: %s\n\n[Timer]\n' "$name"
      printf '%s\n' "$calendars" | sed 's/^/OnCalendar=/'
      printf 'Persistent=true\n\n[Install]\nWantedBy=timers.target\n'
    } > "$HOME/.config/systemd/user/$unit.timer"
  fi
done
shopt -u nullglob

if command -v systemctl >/dev/null; then
  run systemctl --user daemon-reload
  for src in "$SRC_JOBS_DIR"/*.json; do
    slug="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["slug"])' "$src")"
    run systemctl --user enable --now "opencode-job-$scope_id-$slug.timer" 2>/dev/null \
      || warn "could not enable timer for $slug (no user systemd session?)"
  done
fi

# ── 6. Next steps ──────────────────────────────────────────────────────────────
say "Next steps (manual)"
cat <<'EOF'
  1. API keys      : edit ~/.env.local (provider keys) and
                     ~/.config/opencode/opencode-poorguy-ratelimit.jsonc (rotation keys)
  2. opencode bin  : pacman -S opencode  OR  bun add -g opencode-ai@1.18.30
                     (needs >= 1.18.16 for Code Mode; OPENCODE_EXPERIMENTAL_CODE_MODE=1 in .zshrc)
  3. auth logins   : opencode auth login   (providers: zai, opencode)
  4. Obsidian REST : install Local REST API plugin, export cert to
                     ~/.local/share/opencode-certs/obsidian-rest.crt, set OBSIDIAN_API_KEY
  5. searxng       : clone to ~/apps/searxng + venv, then
                     systemctl --user enable --now searxng
  6. llama.cpp     : clone to ~/apps/llama.cpp, run llama-build-cuda, download models to ~/models,
                     then systemctl --user enable --now llama-server@ornith
  7. browsers      : npx -y playwright@1.62.1 install chromium
  8. global CLIs   : npm i -g @fission-ai/openspec opencode-swarm-plugin \
                     @mermaid-js/mermaid-cli markdownlint-obsidian-cli @xberg-io/xberg-cli
  9. verify        : opencode --version && opencode debug config && plugin_health
                     list_jobs  (should show 1 job)  + MCP smoke tests
EOF
echo
info "done."
