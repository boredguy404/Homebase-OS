# Benjamin capability migrations

- Source: owner-provided `Benjamin Michael.zip`
- Confidence: high for the inspected local source; re-check if the archive changes
- Reviewed: 2026-08-24

## Migration rule

Port useful behavior into removable NovaShell modules. Do not copy personal records,
credentials, server configuration, names, uploads, or account-specific defaults. A
migration is complete only when it has its own manifest, survives reloads where that
matters, appears through `/api/user-apps`, and passes the release audit.

## Capability map

| Source pattern | NovaShell destination | Reused idea | Privacy boundary |
| --- | --- | --- | --- |
| Tempo focus sessions | `user-apps/productivity/focus-deck/` | recoverable timer, pause/resume, private session history | no users, accounts, or source records |
| Pantry inventory | `user-apps/utilities/pantry-ledger/` | local inventory, expiry and low-stock sorting, reversible edits | no household names, source inventory, or server storage |
| Lord of the Rocks client | `user-apps/games/novashell-world/` | real 3D navigation and interaction model | only reviewed MIT runtime retained; no personal content |
| Lumen visualizer | `modules/radio-orbit/` | audio-reactive Aurora visual language | no stations, media, or identifying content copied |

## Still under review

Riptide media tooling, Skylight weather presentation, Vantage dashboards, Headway
workflow patterns, and remaining Node sub-apps are candidates—not approvals. Prefer
integration into an existing NovaShell surface when a separate app would duplicate UI.
