#!/bin/bash
set -euo pipefail

game="${1:-}"
root="$(cd "$(dirname "$0")/../.." && pwd)"
emulator="$(command -v mgba-qt || true)"

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

if [ -z "$emulator" ] || [ ! -s "$rom" ]; then
  echo "mGBA or the selected ROM is missing." >&2
  exit 1
fi

controller_count=0
if [ -d /dev/input ]; then
  controller_count="$(find /dev/input -maxdepth 1 -type c -name 'js*' 2>/dev/null | wc -l)"
fi

if [ "$controller_count" -lt 2 ]; then
  notify-send "Pocket Archive multiplayer" "Connect two controllers. You can still configure them after mGBA opens." 2>/dev/null || true
fi

# mGBA's actual link session is created by its own "New Multiplayer Window"
# command. Passing two files on the CLI can silently ignore the second one, so
# launch the first game honestly and leave mGBA in charge of the real link.
setsid -f env DISPLAY=:0 "$emulator" -3 "$rom"
notify-send "Pocket Archive multiplayer" "mGBA opened. Choose File → New Multiplayer Window, then assign a different Xbox controller in each window." 2>/dev/null || true
