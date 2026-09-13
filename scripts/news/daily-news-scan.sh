#!/bin/bash
# Nepal Daily News Scan
# Runs the full daily workflow:
# 1. Scrape 5 Nepal news sites
# 2. Save to ~/Downloads/BusinessPlanning/news-intel/{today}/
# 3. Run delta detector against yesterday
# 4. Append summary to vault report ~/Work/Zurnel/Reports/Business/news-intel/{today}.md
#
# Schedule with: opencode scheduler (15 min cron) or systemd timer

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TODAY=$(date +%Y-%m-%d)
DEST="$HOME/Downloads/BusinessPlanning/news-intel/$TODAY"
VAULT_REPORT="$HOME/Work/Zurnel/Reports/Business/news-intel/$TODAY.md"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 NepalIntel/1.0 (contact: owner)"

mkdir -p "$DEST"

echo "=== Nepal News Scan — $TODAY ==="

# 1. Scrape
declare -A SOURCES=(
  ["01-kathmandupost-money"]="https://kathmandupost.com/money"
  ["02-himalayantimes-business"]="https://thehimalayantimes.com/business"
  ["03-nepalitimes-latest"]="https://nepalitimes.com"
  ["04-b360nepal-latest"]="https://www.b360nepal.com"
  ["05-recordnepal-latest"]="https://recordnepal.com"
)

for slug in "${!SOURCES[@]}"; do
  url="${SOURCES[$slug]}"
  out="$DEST/$slug.html"
  echo "  fetching $slug ..."
  curl -sL -A "$UA" --max-time 30 "$url" -o "$out" || echo "  WARN: $slug failed"
done

# 2. Run delta detector
echo "  running delta detector ..."
python3 "$SCRIPT_DIR/news-delta-detector.py" --today "$TODAY" 2>&1 | tail -3

# 3. Update vault report (append a new run entry if the file already exists)
if [ ! -f "$VAULT_REPORT" ]; then
  echo "  creating vault report ..."
  cat > "$VAULT_REPORT" <<MDEOF
---
created: $TODAY
type: daily-intel
auto_generated: true
last_run: $(date -Iseconds)
---

# Nepal Daily News Intel — $TODAY

> Auto-generated daily scan. See \`~/Downloads/BusinessPlanning/news-intel/$TODAY/\` for raw HTML.

## Sources scraped

| # | Source | Section | URL |
|---|---|---|---|
| 1 | The Kathmandu Post | Money | https://kathmandupost.com/money |
| 2 | The Himalayan Times | Business | https://thehimalayantimes.com/business |
| 3 | Nepali Times | Latest | https://nepalitimes.com |
| 4 | Business 360 Nepal | Latest | https://www.b360nepal.com |
| 5 | Record Nepal | Latest | https://recordnepal.com |

## Delta report

See \`~/Downloads/BusinessPlanning/news-intel/$TODAY/delta-report.md\`.

## Top 10 new stories

_(to be filled by an agent session; this script only fetches)_

## Top 10 continuing stories

_(to be filled)_

## Business implications

_(to be filled)_

## Open questions

_(to be filled)_
MDEOF
else
  echo "  appending run entry to existing vault report ..."
  cat >> "$VAULT_REPORT" <<MDEOF

## Run entry — $(date -Iseconds)

Auto-scan re-ran. See \`~/Downloads/BusinessPlanning/news-intel/$TODAY/\` for fresh HTML.
MDEOF
fi

echo "=== Done — $TODAY ==="
echo "  Raw: $DEST"
echo "  Vault: $VAULT_REPORT"
