#!/bin/bash
# Record an actual NovaShell build milestone in the local Project Board.
# Usage: ./scripts/project-update.sh project-task-id todo|doing|done "message" ["task title for a new card"]
set -euo pipefail

task="${1:?project task id required}"
lane="${2:?todo, doing, or done required}"
message="${3:?build message required}"
title="${4:-}"
payload="$(jq -n --arg task "$task" --arg lane "$lane" --arg message "$message" --arg text "$title" '{task:$task,lane:$lane,message:$message,text:$text}')"
curl -fsS -H 'Sec-Fetch-Site: same-origin' -H 'Content-Type: application/json' \
  --data "$payload" http://127.0.0.1:8765/api/project-feed >/dev/null
