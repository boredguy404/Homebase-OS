#!/usr/bin/env bash
# NovaShell's public-release guard. It checks only source-controlled, public
# contracts; it never reads local libraries, ROMs, saves, keys, or media input.
# Usage: ./scripts/release-audit.sh [http://127.0.0.1:8765]
set -euo pipefail

base="${1:-http://127.0.0.1:8765}"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

need(){ command -v "$1" >/dev/null || { echo "Missing required command: $1" >&2; exit 1; }; }
need curl
need node
need python3
need git

echo "NovaShell release audit"
echo "  source: $root"
echo "  server: $base"

python3 -m py_compile server.py
node --check assets/scripts/homebase/deck.js
node --check assets/scripts/homebase/command-palette.js
node --check modules/radio-orbit/app.js
node --check user-apps/games/novashell-world/world3d.js
echo "✓ core syntax"

./scripts/verify-theme-contract.sh "$base"

python3 - <<'PY'
from pathlib import Path
import re

readme = Path('README.md').read_text(encoding='utf-8')
refs = re.findall(r'\]\((media/[^)]+)\)', readme)
missing = [ref for ref in refs if not Path(ref).is_file()]
if missing:
    raise SystemExit('README media missing: ' + ', '.join(missing))
print(f'✓ README media ({len(refs)} references)')
PY

private_paths="$(git ls-files | python3 -c 'import sys; from pathlib import Path; blocked={"roms","bios","saves","covers","imports","local","emulatorjs"}; print("\\n".join(p for p in sys.stdin.read().splitlines() if blocked.intersection(Path(p).parts)))')"
if [[ -n "$private_paths" ]]; then
  echo "Public-release violation: private runtime paths are tracked:" >&2
  printf '%s\n' "$private_paths" >&2
  exit 1
fi
echo "✓ tracked-file privacy boundary"

apps_json="$(curl -fsS "$base/api/user-apps")"
printf '%s' "$apps_json" | node -e '
  let raw="";process.stdin.on("data",chunk=>raw+=chunk).on("end",()=>{
    const data=JSON.parse(raw),apps=Array.isArray(data)?data:(data.apps||[]);
    const expected=["Maker Desk","Quest Board","NovaShell World","Pokedex Browser","Weather Station","Focus Deck","Pantry Ledger","Loop Lab","Writer Desk"];
    const missing=expected.filter(name=>!apps.some(app=>app.name===name));
    if(missing.length){console.error("Missing registered user apps: "+missing.join(", "));process.exit(1)}
    console.log("✓ user-app registration ("+apps.length+" apps)");
  });'

for route in / /pages/arcade.html /pages/files.html /pages/browse.html /pages/settings.html /pages/utility-desk.html /modules/radio-orbit/index.html /user-apps/games/quest-board/index.html /user-apps/games/novashell-world/index.html /user-apps/reference/pokedex-browser/index.html /user-apps/productivity/focus-deck/index.html /user-apps/productivity/writer-desk/index.html /user-apps/utilities/pantry-ledger/index.html /user-apps/media/loop-lab/index.html; do
  curl -fsS "$base$route" >/dev/null
done
echo "✓ key routes respond"

printf 'Release audit passed. Run docs/HARDWARE_CONTROLLER_SMOKE.md separately with real controller hardware.\n'
