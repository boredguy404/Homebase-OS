# Source capability shortlist

- Sources: owner-provided Benjamin archive manifests and private FTP metadata
- Confidence: high for names/descriptions, medium for implementation fit until code review
- Reviewed: 2026-08-24

## Ship or integrate

| Capability | Direction | Status |
| --- | --- | --- |
| Focus session engine | removable Focus Deck | shipped |
| Pantry inventory | removable Pantry Ledger | shipped |
| Local audio loop editor | removable Loop Lab | shipped |
| Screenplay/file writer | Writer Desk with local drafts plus opt-in Chromium file handles | shipped |
| 3D world and generated shelf | NovaShell World + Maker Desk | foundation shipped |
| Knowledge graph | Relay Second Brain | foundation shipped |
| Hyperlocal weather | improve Weather Station, not another app | reviewed |
| Markets watchlist | local watchlist with clearly sourced delayed data | review API and financial disclaimers |
| Live transit | Rail Finder ships the keyless station/accessibility directory; predictions remain gated on an approved CTA key | partial, honest boundary shipped |
| Sports scores | Browse live-data category | review stable public feeds and attribution |
| Route-stop finder | travel utility using user-entered locations | review map/data licensing |
| Accessible-place finder | accessibility-first local search | review data completeness and avoid safety claims |
| Skeletal animation tool | do not substitute a generic draggable rig; revisit only after a faithful source-workflow review | rejected prototype removed |
| Round/interval timer | Focus Deck training mode | shipped |
| Hydration/breath/reset PWA | removable Reset Station, rebuilt from FTP manifest concept | shipped |

## Exclude or consolidate

- Pro/alias/redirect packages are variants, not separate NovaShell apps.
- Personal messaging, family chat, private youth records, and individual communication
  data do not migrate.
- Airwave/NOX audio and cinema surfaces overlap Orbit and Browse; only distinct,
  reviewed interaction patterns should integrate.
- Property foreclosure scouting and trading-adjacent features require a separate
  accuracy, legal, data-source, and user-risk review before implementation.
- FTP metadata showed four actual app roots. Its reusable plugin catalog currently
  contains the already-migrated Pokedex Browser; communication roots are excluded.
