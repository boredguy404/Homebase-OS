---
type: audit
status: active
confidence: verified
source: owner-provided Benjamin archive review and FTP metadata review
reviewed: 2026-08-30
---

# Source capability adoption audit

NovaShell’s reviewed source patterns are represented as clean, local modules or
explicitly held back. This audit records the current state; it does not claim
that private source code, data, media, credentials, or accounts were copied.

| Reviewed pattern | NovaShell surface | Verification evidence |
| --- | --- | --- |
| Focus / recovery | Focus Deck and Reset Station | removable manifests + local smoke gate |
| Local inventory | Pantry Ledger | removable manifest + local smoke gate |
| Local audio control | Loop Lab and Radio Orbit | removable module + local smoke gate |
| Weather console | Weather Station | removable manifest + local smoke gate |
| Transit workflow | Rail Finder | removable manifest + local smoke gate |
| Dashboard overview | Signal Board | removable manifest + harness/workflow API smoke |
| Plain-file brain | Second Brain | local content search, map, owner-note lifecycle, and endpoint smoke |
| World / map maker | NovaShell World and Maker Desk | removable manifests + local smoke gate |
| FTP plugin catalog | Pokedex Browser | existing clean, removable reference app |

## Not migrated by design

- Personal communications, records, accounts, uploads, databases, logs, media,
  server configuration, credentials, and operational backups.
- Markets, sports, route discovery, and accessibility-place products without a
  separate source, licensing, freshness, safety, and user-risk review.
- Remaining Node sub-apps without an owner-selected capability and clean
  integration plan.

## Stable gate

Run `bash scripts/source-module-smoke.sh` with the local helper running. It
verifies every removable module manifest, declared entry, JavaScript syntax, and
local entry response. Feature-specific visual, hardware, and data checks still
apply where relevant.
