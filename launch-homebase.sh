#!/bin/bash
set -u
web_root="$(cd "$(dirname "$0")" && pwd)"
port="8765"
if ! curl -fsS "http://127.0.0.1:${port}/api/status" 2>/dev/null | grep -q '"service": "homebase-v61"'; then
  setsid -f python3 "$web_root/server.py" </dev/null >"/tmp/homebase-server.log" 2>&1
  for attempt in 1 2 3 4 5; do
    curl -fsS "http://127.0.0.1:${port}/api/status" >/dev/null 2>&1 && break
    sleep 1
  done
fi

url="http://127.0.0.1:${port}/?v=$(date +%s)"
echo "Opening Homebase at ${url}"
garcon-url-handler "$url"
