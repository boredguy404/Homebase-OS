#!/bin/bash
set -euo pipefail

game="${1:-}"
root="$(cd "$(dirname "$0")/../.." && pwd)"
emulator="$root/bin/squashfs-root/AppRun"

case "$game" in
  mario)
    rom="$root/roms/mario-kart-super-circuit.gba"
    window_title="Mario Kart"
    ;;
  streetfighter)
    rom="$root/roms/street-fighter-alpha-3.gba"
    window_title="Street Fighter"
    ;;
  *)
    echo "Usage: $0 mario|streetfighter" >&2
    exit 2
    ;;
esac

if [ ! -x "$emulator" ] || [ ! -s "$rom" ]; then
  echo "Multiplayer emulator or ROM is missing." >&2
  exit 1
fi

controller_count=0
if [ -d /dev/input ]; then
  controller_count="$(find /dev/input -maxdepth 1 -type c -name 'js*' 2>/dev/null | wc -l)"
fi

if [ "$controller_count" -lt 2 ]; then
  notify-send "Pocket Archive multiplayer" "Connect two controllers. You can still configure them after mGBA opens." 2>/dev/null || true
fi

setsid -f env DISPLAY=:0 "$emulator" -3 "$rom" "$rom"

# Tile the two linked handheld screens side by side after they appear.
for attempt in $(seq 1 30); do
  mapfile -t windows < <(DISPLAY=:0 xdotool search --onlyvisible --name "$window_title" 2>/dev/null | tail -2)
  if [ "${#windows[@]}" -ge 2 ]; then
    screen_width="$(DISPLAY=:0 xrandr --current | awk '/ connected primary| connected / {split($3, size, "+"); split(size[1], px, "x"); print px[1]; exit}')"
    screen_height="$(DISPLAY=:0 xrandr --current | awk '/ connected primary| connected / {split($3, size, "+"); split(size[1], px, "x"); print px[2]; exit}')"
    half_width=$((screen_width / 2))
    usable_height=$((screen_height - 80))
    DISPLAY=:0 xdotool windowsize "${windows[0]}" "$half_width" "$usable_height" windowmove "${windows[0]}" 0 40
    DISPLAY=:0 xdotool windowsize "${windows[1]}" "$half_width" "$usable_height" windowmove "${windows[1]}" "$half_width" 40
    notify-send "Pocket Archive multiplayer" "Linked screens ready. Choose Multiplayer/VS in both games." 2>/dev/null || true
    exit 0
  fi
  sleep 0.4
done

notify-send "Pocket Archive multiplayer" "mGBA opened, but automatic window tiling did not finish." 2>/dev/null || true
