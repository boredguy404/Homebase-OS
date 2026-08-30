---
type: map
status: active
confidence: verified
source: local capability audit
reviewed: 2026-08-30
---

# NovaShell capability portfolio

This is the short map Relay should use when deciding whether a request belongs in the core shell, a removable user app, a local data tool, or an external handoff.

| Area | Current NovaShell home | Source-informed lesson | Status |
| --- | --- | --- | --- |
| Knowledge and decisions | Second Brain + Relay | plain files are readable, searchable, and reviewable | active |
| Long-running work | Relay Workflows + Project Board | explicit steps and completion checks beat hidden background work | active |
| Audio tools | Radio Orbit + Loop Lab | local media controls should work without accounts | active |
| Personal utilities | Focus Deck, Reset Station, Pantry Ledger | useful data can remain browser-local and reversible | active |
| Desktop world | NovaShell World + Maker Desk | tangible navigation is optional, never the only route | active |
| Weather and local signals | Weather Station + Rail Finder | show source/state clearly and fail softly | active |
| Image viewing | Gallery app | owner-picked files, no cloud upload required | active |
| Markets, sports, routes | Browse candidates | needs stable data sources and a separate accuracy review | research |

## Routing rule

Use a core module for a shell-wide concern. Use a removable user app for a focused tool. Keep user files local by default. Send a task outside NovaShell only through an explicit workflow handoff.

## Current reviewed sources

The owner-provided Benjamin archive contributes reviewed capability patterns for focus, local media, weather presentation, workflows, a visible knowledge brain, and optional world navigation. The FTP audit contributes metadata-level patterns for utilities and browse surfaces. Neither source is bundled as a runtime input.
