#!/bin/bash
set -eu

project_dir="$(cd "$(dirname "$0")" && pwd)"
port="8765"

status() {
  curl -fsS "http://127.0.0.1:${port}/api/status"
}

start() {
  if status >/dev/null 2>&1; then
    status
    return
  fi
  tmux new-session -d -s homebase-web "cd '$project_dir' && exec python3 server.py >>/tmp/homebase-server.log 2>&1" 2>/dev/null || true
  for attempt in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
    if status 2>/dev/null; then return; fi
    sleep 1
  done
  echo "Homebase did not start within 20 seconds. Run '$0 logs' for details." >&2
  return 1
}

stop() {
  tmux kill-session -t homebase-web 2>/dev/null || true
}

check() {
  cd "$project_dir"
  node --check assets/scripts/homebase/deck.js
  node --check modules/radio-orbit/app.js
  python3 -m py_compile server.py
  git diff --check
  echo "Homebase checks passed."
}

smoke() {
  start >/dev/null
  curl -fsS "http://127.0.0.1:${port}/api/status"
  curl -fsS "http://127.0.0.1:${port}/assets/scripts/homebase/deck.js" | grep -q 'orbit-mini-canvas'
  curl -fsS "http://127.0.0.1:${port}/assets/styles/shared/ultra-retro.css" | grep -q 'retro-menubar'
  echo "Homebase runtime smoke test passed."
}

screenshot() {
  start >/dev/null
  output="${2:-/tmp/homebase-screenshot.png}"
  page="${3:-/?v=61}"
  chromium --headless --no-sandbox --disable-gpu --hide-scrollbars --window-size=1365,900 --screenshot="$output" "http://127.0.0.1:${port}${page}"
  echo "$output"
}

case "${1:-status}" in
  start) start ;;
  restart) stop; start ;;
  stop) stop ;;
  status) status ;;
  check) check ;;
  smoke) smoke ;;
  screenshot) screenshot "$@" ;;
  logs) tail -n 100 /tmp/homebase-server.log ;;
  open)
    start >/dev/null
    container_ip="$(ip -4 -brief address show scope global | awk 'NR==1 {split($3, address, "/"); print address[1]}')"
    garcon-url-handler "http://${container_ip}:${port}/?v=61"
    ;;
  *)
    echo "Usage: $0 {start|restart|stop|status|check|smoke|screenshot|logs|open}" >&2
    exit 2
    ;;
esac
