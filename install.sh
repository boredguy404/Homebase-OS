#!/usr/bin/env bash
set -euo pipefail

repo="https://github.com/boredguy404/Homebase-OS.git"
target="${HOME}/homebase"

if ! command -v git >/dev/null || ! command -v curl >/dev/null || ! command -v 7z >/dev/null; then
  sudo apt-get update
  sudo apt-get install -y git curl p7zip-full python3
fi

if [ -d "${target}/.git" ]; then
  git -C "${target}" pull --ff-only
else
  git clone "${repo}" "${target}"
fi

mkdir -p "${target}/roms" "${target}/saves" "${target}/covers" "${target}/imports" "${HOME}/My Library" "${target}/emulatorjs"

if [ ! -f "${target}/emulatorjs/data/loader.js" ]; then
  archive="$(mktemp --suffix=.7z)"
  runtime="$(mktemp -d)"
  curl -fL "https://github.com/EmulatorJS/EmulatorJS/releases/download/v4.2.3/4.2.3.7z" -o "${archive}"
  7z x -y "${archive}" -o"${runtime}" >/dev/null
  data_dir="$(find "${runtime}" -type d -name data -print -quit)"
  if [ -z "${data_dir}" ]; then echo "EmulatorJS data directory was not found." >&2; exit 1; fi
  cp -a "${data_dir}" "${target}/emulatorjs/"
  rm -f "${archive}"
  rm -rf "${runtime}"
fi

chmod +x "${target}/launch-homebase.sh" "${target}/launch-homebase-kiosk.sh"
"${target}/launch-homebase.sh"
