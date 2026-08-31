#!/usr/bin/env bash
# Obsidian plugin auto-installer for the Zurnel vault.
# Downloads latest release (main.js, manifest.json, styles.css) for every plugin
# listed in .obsidian/plugins.tsv. Which plugins are ENABLED is controlled by
# .obsidian/community-plugins.json (tracked in git), not by this script.
#
# Usage:
#   scripts/install-plugins.sh            # install missing plugins
#   scripts/install-plugins.sh --force    # re-download all, overwriting dists
set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TSV="$VAULT_ROOT/.obsidian/plugins.tsv"
PLUGINS_DIR="$VAULT_ROOT/.obsidian/plugins"
FORCE=0
[[ "${1:-}" == "--force" ]] && FORCE=1

ok=0; skip=0; manual=0; fail=0

while IFS=$'\t' read -r pid repo; do
  [[ "$pid" =~ ^#.*$ || -z "$pid" ]] && continue
  dest="$PLUGINS_DIR/$pid"

  if [[ "$repo" == "MANUAL" ]]; then
    echo "MANUAL  $pid — not in any registry; keep folder synced via git"
    ((manual++))
    continue
  fi

  if [[ $FORCE -eq 0 && -s "$dest/main.js" ]]; then
    ((skip++))
    continue
  fi

  echo "INSTALL $pid  ($repo)"
  mkdir -p "$dest"
  base="https://github.com/$repo/releases/latest/download"
  failed_file=""
  for f in main.js manifest.json styles.css; do
    if curl -fsSL --retry 3 -o "$dest/$f" "$base/$f"; then
      :
    else
      rm -f "$dest/$f"
      [[ "$f" != "styles.css" ]] && failed_file="$f"
    fi
  done

  # sanity: folder name must equal manifest id or Obsidian won't load it
  if [[ -n "$failed_file" ]]; then
    echo "  FAILED: could not download $failed_file" >&2
    ((fail++))
  elif ! python3 -c "import json,sys; sys.exit(0 if json.load(open('$dest/manifest.json'))['id']=='$pid' else 1)" 2>/dev/null; then
    echo "  FAILED: manifest id mismatch for $pid" >&2
    rm -f "$dest/main.js" "$dest/manifest.json"
    ((fail++))
  else
    ((ok++))
  fi
done < "$TSV"

echo
echo "Done. installed=$ok skipped=$skip manual=$manual failed=$fail"
(( fail > 0 )) && exit 1
exit 0
