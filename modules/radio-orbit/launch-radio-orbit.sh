#!/usr/bin/env bash
set -euo pipefail
if ! curl -fsS http://127.0.0.1:8080/ >/dev/null 2>&1; then
  tmux has-session -t radio-orbit-web 2>/dev/null && tmux kill-session -t radio-orbit-web
  tmux new-session -d -s radio-orbit-web "cd '$(cd "$(dirname "$0")" && pwd)' && python3 server.py"
fi
garcon-url-handler http://127.0.0.1:8080/
