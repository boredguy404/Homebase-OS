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
require "NovaShellGamepads\.controls\(\)" pages/arcade.html "Pocket Archive is not loading the full controller contract."
require "gamepadSelection\[player\]=pad\?" assets/scripts/arcade/emulator-gamepads.js "Distinct physical pads are not assigned to distinct players."
require "1:cloneForPlayer\(1\)" assets/scripts/arcade/emulator-gamepads.js "Player-two controls are missing."
require "LEFT_STICK_X:\+1" assets/scripts/arcade/emulator-gamepads.js "Analog stick mappings are missing."
require "markedMultiplayer=.*playerInfo" assets/scripts/arcade/game-details.js "Imported multiplayer metadata no longer enables the N64 versus launch."
if rg -q "function pumpStick|simulateInput\(player" pages/arcade.html; then
  echo "Controller contract failed: legacy double-input loop is still active." >&2
  exit 1
fi

# Orbit B must return to a persistent mini player, not remove the live iframe.
require "function returnHome\(\)" assets/scripts/homebase/deck.js "Orbit Home helper is missing."
require "if\(event\.data\?\.type===\'orbit-home\'\)\{returnHome\(\);return\}" assets/scripts/homebase/deck.js "Orbit Back no longer preserves the mini player."
require "if\(b\)parent\.postMessage\(\{type:\'orbit-home\'\}" modules/radio-orbit/app.js "Orbit Xbox B route is missing."

# The user-facing Chrome gamepad smoke check must remain discoverable.
require "CONTROLLER SMOKE TEST" assets/scripts/settings/settings-device-center.js "Controller smoke surface is missing."
require "navigator\.getGamepads" assets/scripts/settings/settings-device-center.js "Browser Gamepad API check is missing."

echo "Controller contract passed. Run docs/HARDWARE_CONTROLLER_SMOKE.md with real hardware for final acceptance."
