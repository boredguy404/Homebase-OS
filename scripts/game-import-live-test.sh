#!/bin/bash
# Disposable end-to-end proof for the private owned-game import contract.
set -euo pipefail

repo="$(cd "$(dirname "$0")/.." && pwd)"
server="${1:-http://127.0.0.1:8765}"
name="novashell-import-contract-$$.gba"
relative="$name"
key="roms:$relative"
rom_path="$repo/roms/$relative"
catalog="$repo/imports/homebase-game-catalog.json"
cover_path="$repo/covers/import-contract-cover.png"

cleanup() {
  if [ -f "$rom_path" ]; then rm -- "$rom_path"; fi
  if [ -f "$cover_path" ]; then rm -- "$cover_path"; fi
  find "$repo/local/artwork-backups" -maxdepth 1 -type f -name '*-import-contract-cover.png' -delete 2>/dev/null || true
  if [ -f "$catalog" ]; then
    temporary="$(mktemp "$repo/imports/.game-import-contract.XXXXXX")"
    jq --arg key "$key" 'del(.[$key])' "$catalog" > "$temporary"
    mv -- "$temporary" "$catalog"
  fi
}
trap cleanup EXIT

if [ -e "$rom_path" ]; then
  echo "Refusing to touch an existing test path: $rom_path" >&2
  exit 1
fi

upload="$(curl -fsS -X POST "$server/api/game-import/file?kind=rom" \
  -H 'X-Homebase-Local: 1' -H "X-File-Name: $name" -H 'X-Game-Slug: import-contract' \
  --data-binary 'NOVASHELL PRIVATE IMPORT CONTRACT FIXTURE')"
test "$(jq -r '.path' <<<"$upload")" = "roms/$relative"

payload="$(jq -n --arg name "$name" --arg key "$key" --arg relative "$relative" '{title:"Import Contract Fixture",slug:"import-contract-fixture",system:"GBA",description:"Disposable local contract fixture.",genre:"Test",year:"",players:"1–2 players",controls:"Standard Xbox mapping",mosaic:false,rom_name:$name,catalog_key:$key,source_path:$relative}')"
curl -fsS -X POST "$server/api/game-import/metadata" -H 'Content-Type: application/json' -H 'X-Homebase-Local: 1' --data "$payload" | jq -e '.saved == true' >/dev/null
curl -fsS "$server/api/games" | jq -e --arg key "$key" '.games[] | select(.catalog_key == $key and .name == "Import Contract Fixture" and .players == "1–2 players")' >/dev/null

curl -fsS -X POST "$server/api/game-import/file?kind=cover" -H 'X-Homebase-Local: 1' -H 'X-File-Name: cover.png' -H 'X-Game-Slug: import-contract' --data-binary 'ARTWORK-V1' | jq -e '.backed_up == false' >/dev/null
curl -fsS -X POST "$server/api/game-import/file?kind=cover&replace=1" -H 'X-Homebase-Local: 1' -H 'X-Replace-Existing: yes' -H 'X-File-Name: cover.png' -H 'X-Game-Slug: import-contract' --data-binary 'ARTWORK-V2' | jq -e '.backed_up == true' >/dev/null
test "$(find "$repo/local/artwork-backups" -maxdepth 1 -type f -name '*-import-contract-cover.png' | wc -l)" -eq 1

duplicate_status="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$server/api/game-import/file?kind=rom" -H 'X-Homebase-Local: 1' -H "X-File-Name: $name" -H 'X-Game-Slug: import-contract' --data-binary 'DUPLICATE')"
test "$duplicate_status" = "409"

echo "Game import live test passed: upload, catalog identity, library visibility, duplicate safety, and backed-up artwork replacement."
