---
type: map
status: active
confidence: verified
source: NovaShell repository structure
reviewed: 2026-08-23
---

# Local-first architecture map

`server.py` is the local helper for safe device readings, user-app inventory,
approved local file actions, backups, and protected Relay routes.

- `pages/` contains NovaShell surfaces such as Settings, Browse, Library, and Utility Desk.
- `assets/` contains reusable styles and browser behavior.
- `modules/` contains larger optional modules, including Orbit.
- `user-apps/` contains removable self-contained apps.
- `brain/` contains read-only local notes that help Relay explain contracts.
- `local/` is ignored and may contain optional keys, imported Brain notes, and runtime state.

The public app must never track owner ROMs, BIOS files, saves, private media, credentials, or imported local notes.

## Second Brain navigation

The Second Brain exposes the same local index through a list reader and a
structure map. The map is a direct folder/category projection of indexed notes:
selecting a node opens that exact note in the same reader. It is intentionally
not an invented semantic graph, so visual connections never claim relationships
that the note files do not actually state.
