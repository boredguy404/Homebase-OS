#!/usr/bin/env bash
set -euo pipefail

# Local-only kiosk launcher. Run this from Linux Terminal, never from Chrome's
# address bar. It owns no system settings and exits normally with Alt+F4.
root="$(cd "$(dirname "$0")" && pwd)"
port=8765
url="http://127.0.0.1:${port}/"

if ! curl -fsS "${url}api/status" >/dev/null 2>&1; then
  setsid -f python3 "${root}/server.py" </dev/null >"/tmp/homebase-server.log" 2>&1
  for attempt in 1 2 3 4 5 6 7 8; do
    curl -fsS "${url}api/status" >/dev/null 2>&1 && break
    sleep 1
  done
fi

curl -fsS "${url}api/status" >/dev/null || { echo "Homebase did not start. See /tmp/homebase-server.log" >&2; exit 1; }
browser="$(command -v chromium || command -v chromium-browser || command -v google-chrome || true)"
if [ -z "${browser}" ]; then
  echo "Chromium was not found in Linux. Install it, then run this command again." >&2
  exit 1
fi
echo "Opening NovaShell kiosk at ${url}"
exec "${browser}" --kiosk --app="${url}"
