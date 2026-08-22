#!/bin/bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
doom_dir="$root/doom"
owned_wad="$doom_dir/DOOM.WAD"
free_wad="/usr/share/games/doom/freedoom2.wad"

mkdir -p "$doom_dir"
if [ -s "$owned_wad" ]; then
  iwad="$owned_wad"
  label="Owned DOOM.WAD"
else
  iwad="$free_wad"
  label="Freedoom: Phase 2"
fi

notify-send "Homebase" "Starting $label in high resolution" 2>/dev/null || true
setsid -f /usr/games/woof -iwad "$iwad" -fullscreen
