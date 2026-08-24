# Hosted Companion Parity Matrix

NovaShell’s hosted companion is a browser-safe PWA, not a remote shell. This matrix keeps the web edition honest while preserving useful local-first behavior.

| Capability | Local NovaShell | Hosted companion | Honest UI language |
| --- | --- | --- | --- |
| Desktop launcher | Can request installed Linux helpers through the local server | PWA shortcuts and external links only | “Opens on this device” locally; “Open external app/site” on web |
| Files and folders | Reads approved home-folder locations through the local helper | User-picked files/folders only, held in browser storage when supported | “Choose files” rather than “scan your computer” |
| Game shelf | Scans owner-approved local ROM folders and launches local EmulatorJS | Browser-selected owner files in IndexedDB, no background scan, and no claim that an emulator runtime is installed | “Add a game you own” |
| Saves and backup | Exports/imports selected local groups with a manifest | Exports/imports notes, tasks, preferences, cached weather, and browser-owned game data as inspectable JSON | “Browser data backup” |
| Orbit radio and playlists | Internet radio plus local playlist files | Same, with user-selected audio files retained only for the session unless browser storage is chosen | “Loaded in this browser” |
| Utility Desk | Local device readings, file hashes, notes, clipboard handoff, Kanban | Notes and a three-lane Kanban; no device readings | “Local browser workspace” |
| Weather, Browse, API catalog | Public web requests and optional local location override | Same public web requests | “Online source” |
| Relay local guide | Approved device status and in-app navigation | In-app help, public documentation, and browser-safe navigation | “Browser guide” |
| Relay AI routes | Optional ignored local provider profile and a confirmed Local Codex runner | Person-managed provider key in browser/session storage only; no command runner | “Drafts only—cannot run commands” |
| Workspace Editor and Local Codex | Allowlisted local files, review, typed confirmation, local backups | Not available | “Available only in local NovaShell” |
| Linux app discovery | Reads installed launchers and starts local install jobs | Browse metadata and official external links only | “View install instructions” |
| Controllers | Browser Gamepad API plus local emulator mapping | Browser Gamepad API where the browser exposes it | “Controller support depends on this browser” |

## Release gate

Before a hosted feature ships, confirm all of the following:

1. It does not imply the browser can see unselected files, native applications, or operating-system telemetry.
2. It labels external navigation, browser storage, and network requests before the action.
3. It keeps owner-provided ROMs, saves, artwork, credentials, and local logs out of the hosted repository and deployment.
4. It has a usable touch path and a controller fallback where a controller is meaningful.
5. Its local-only alternative is named directly instead of being silently omitted.
