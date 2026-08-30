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
| Riptide audio engine | `user-apps/media/loop-lab/` | local waveform, A/B loop points, playback speed and touch seeking | no bundled tracks, presets, source identity, or server code |
| Skylight weather console | `user-apps/utilities/weather-station/` | local forecast console, clear source state, and offline fallback | no source records, location history, or provider credentials |
| Vantage dashboard pattern | `user-apps/utilities/signal-board/` | local capability/workflow overview with explicit state | no source dashboard data, analytics, or control plane |
| Headway transit pattern | `user-apps/utilities/rail-finder/` | clear keyless directory and honest gated-live-data boundary | no source users, keys, or private routes |
| Cortex knowledge structure | `pages/second-brain.html` | plain-file local notes, categories, content search, and structure map | no archive notes, vectors, sources, or personas copied |

## Remaining review boundary

The reviewed interaction patterns above are now represented by modular NovaShell
surfaces and must continue to pass the source-module smoke gate. Remaining Node
sub-apps are not bulk-migration candidates: a future one needs an owner-selected
capability, a privacy review, an ownership/license check, and a reason it cannot
be cleanly integrated into an existing surface.
