#!/usr/bin/env bash
# Small local theme-wiring smoke test for the core NovaShell pages.
# Usage: ./scripts/verify-theme-contract.sh [http://127.0.0.1:8765]
set -euo pipefail

base="${1:-http://127.0.0.1:8765}"
pages=(/ /pages/arcade.html /pages/files.html /pages/apps.html /pages/browse.html /pages/settings.html /pages/utility-desk.html /pages/console.html)
themes=(ultra-retro cobalt)
checked=0

for theme in "${themes[@]}"; do
  for page in "${pages[@]}"; do
    url="${base}${page}?theme=${theme}&theme-contract=1"
    source="$(curl -fsS "$url")"
    if ! printf '%s' "$source" | rg -q 'theme-sync\.js|homebase/deck\.js'; then
      echo "Theme wiring failed: ${page} has no shared theme entry point." >&2
      exit 1
    fi
    checked=$((checked + 1))
  done
done

echo "Theme wiring passed: ${checked} core page/theme combinations. Rendered screenshots remain the visual gate."
