#!/usr/bin/env bash
set -euo pipefail

# Release check for NovaShell's removable, source-informed module pattern.
# Start the local helper first, or pass another local base URL as $1.
base_url="${1:-http://127.0.0.1:8765}"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
apps_root="$root/user-apps"

for command in curl jq node; do
  command -v "$command" >/dev/null || { echo "Missing required command: $command" >&2; exit 1; }
done

count=0
while IFS= read -r -d '' manifest; do
  folder="$(dirname "$manifest")"
  entry="$(jq -er '.entry | strings | select(test("^[A-Za-z0-9._/-]+$"))' "$manifest")"
  name="$(jq -er '.name | strings | select(length > 0)' "$manifest")"
  [[ "$entry" != *".."* && "$entry" != /* ]] || { echo "Unsafe entry for $name: $entry" >&2; exit 1; }
  [[ -f "$folder/$entry" ]] || { echo "Missing entry for $name: $folder/$entry" >&2; exit 1; }
  while IFS= read -r -d '' source; do node --check "$source"; done < <(find "$folder" -type f -name '*.js' -print0)
  relative="${folder#$root/}"
  status="$(curl -sS -o /dev/null -w '%{http_code}' "$base_url/$relative/$entry")"
  [[ "$status" == "200" ]] || { echo "Local entry failed ($status): $name" >&2; exit 1; }
  printf 'ok · %s · %s\n' "$name" "$relative/$entry"
  count=$((count+1))
done < <(find "$apps_root" -type f -name app.json -print0 | sort -z)

[[ "$count" -gt 0 ]] || { echo "No removable apps found." >&2; exit 1; }
echo "Source module smoke passed · $count removable apps"
