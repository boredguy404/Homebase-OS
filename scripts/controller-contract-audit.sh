#!/usr/bin/env bash
# Source-level guard for NovaShell's controller ownership contract.
# It complements, never replaces, docs/HARDWARE_CONTROLLER_SMOKE.md.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

need(){ command -v "$1" >/dev/null || { echo "Missing required command: $1" >&2; exit 1; }; }
need rg

require(){
  local pattern="$1" file="$2" note="$3"
  if ! rg -q --pcre2 "$pattern" "$file"; then
    echo "Controller contract failed: $note" >&2
    exit 1
  fi
}

# Arcade shelf owns B only while the shelf is visible, then releases it to an
# active emulator. Both browser pads must be forwarded through EmulatorJS.
require "if\(back\)\{const open=.*else location\.href='/'" pages/arcade.html "Pocket Archive B-back handling is missing."
require "playing=document\.querySelector\('#player'\)\?\.style\.display!==\'none\'" pages/arcade.html "Emulator-active ownership guard is missing."
require "for\(let player=0;player<players;player\+\+\)" pages/arcade.html "Two-player routing loop is missing."
require "window\.EJS_defaultControls=\{0:xboxMap,1:\{\.\.\.xboxMap\}\}" pages/arcade.html "Player-one/player-two EmulatorJS controls are missing."

# Orbit B must return to a persistent mini player, not remove the live iframe.
require "event\.data\?\.type===\'orbit-home\'\)\{minimizeOrbit\(\);closePocket\(\);return\}" assets/scripts/homebase/deck.js "Orbit Back no longer preserves the mini player."
require "if\(b\)parent\.postMessage\(\{type:\'orbit-home\'\}" modules/radio-orbit/app.js "Orbit Xbox B route is missing."

# The user-facing Chrome gamepad smoke check must remain discoverable.
require "CONTROLLER SMOKE TEST" assets/scripts/settings/settings-device-center.js "Controller smoke surface is missing."
require "navigator\.getGamepads" assets/scripts/settings/settings-device-center.js "Browser Gamepad API check is missing."

echo "Controller contract passed. Run docs/HARDWARE_CONTROLLER_SMOKE.md with real hardware for final acceptance."
