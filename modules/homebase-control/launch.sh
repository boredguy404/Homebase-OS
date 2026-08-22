#!/bin/bash
set -u
root="$(cd "$(dirname "$0")" && pwd)"; port=8780
if ! curl -fsS "http://127.0.0.1:$port/api/status" >/dev/null 2>&1; then
  tmux has-session -t homebase-control 2>/dev/null && tmux kill-session -t homebase-control
  tmux new-session -d -s homebase-control "python3 '$root/server.py'"
fi
garcon-url-handler "http://penguin.linux.test:$port/"
