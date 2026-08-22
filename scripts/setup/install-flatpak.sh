#!/bin/bash
set -euo pipefail
app_id="${1:-}"
if [[ ! "$app_id" =~ ^[A-Za-z0-9_.-]+$ ]]; then
  exit 2
fi
flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
flatpak install --user -y flathub "$app_id"
