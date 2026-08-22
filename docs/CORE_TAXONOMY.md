# Homebase core taxonomy

This is the editable map for Homebase's core code. It is deliberately separate
from the taxonomy for Relay-created apps in `docs/APP_CONTRACT.md`.

```text
pages/                         Page shells only
assets/scripts/homebase/       Desktop shell, windows, navigation, mini player
assets/scripts/arcade/         Pocket Archive feature behavior
assets/scripts/discovery/      Browse and remote-source presentation
assets/scripts/settings/       Preferences, backup, theme previews
assets/styles/<area>/          Styles owned by the same named area
modules/<product>/             Product manifest, service, and durable contract
user-apps/<taxonomy>/          Independently removable user/Relay apps
server.py                      Local API, filesystem boundary, launch services
```

## Rules for code changes

- A page shell may compose controls, but business behavior goes in a named
  module under `assets/scripts/<area>/`.
- A module has one concern and a declared owner. Do not make a visual file
  mutate storage or a server handler manipulate the DOM.
- Every reusable product surface gets `modules/<product>/manifest.json`.
- Private runtime folders (`roms`, `bios`, `covers`, `imports`, and `saves`) are
  local-only. Public code must use APIs and never assume they are in Git.
- A user-visible feature has touch, mouse, keyboard, and controller behavior
  explicitly considered before it is called complete.

## Current migration priority

1. Pocket Archive: extract the remaining legacy inline CSS and emulator launch
   script into feature modules.
2. Homebase desktop: split the legacy deck bootstrap into window, navigation,
   and media-player modules.
3. Settings: keep each preference family in its own feature file and expose a
   stable preference schema for backup/import.
4. Browse: keep source adapters server-side and cards/modals client-side.
