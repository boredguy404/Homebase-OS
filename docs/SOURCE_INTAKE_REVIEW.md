# Private source intake review

NovaShell can learn from private source archives and future server audits without importing people’s data, credentials, databases, uploads, analytics, logs, or copyrighted media. The archive itself remains external to this repository.

## Intake rule

Every candidate is assessed for interaction patterns and capability only. A NovaShell module is rebuilt from the product contract and current components; it is not copied as an opaque app. Source code is only reused if its ownership and license are confirmed by the owner, then it is isolated, attributed where required, and stripped of server-specific data.

## Current archive capability audit

| Candidate capability | Safe NovaShell direction |
| --- | --- |
| Music-reactive radio / visual channel deck | Improve Radio Orbit’s visual scenes, station discovery, and lightweight background player without bringing in playlists or account data. |
| Map builder / arena prototype | A future local Maker Desk: touch-friendly tile editor, map preview, controller test room, and user-owned project export. No maps or player data are imported. |
| Beat/time manipulation tool | A small offline audio utility: trim/loop markers and visual waveform controls for user-imported tracks, subject to browser capabilities. |
| Hyperlocal weather console | Improve Weather Station’s forecast panels, location detail, and retro presentation using public APIs already cataloged by NovaShell. |
| Markets watchlist | Optional local watchlists and compact sparklines. No trading, brokerage connection, or account synchronization. |
| Graph-like knowledge brain | Extend Relay’s visible Brain browser with local notes, decisions, and module relationships—never private archive notes by default. |
| Generative audiovisual channels | Additional performance-friendly Orbit visualizers, with reduced-motion and Chromebook performance guards. |
| Walkable generated game shelf | A future optional Arcade Room mode that uses only the user’s locally indexed games and custom metadata. |

## Next audit: hosted server

Open `/pages/source-connection.html` to save an SFTP or FTPS profile locally. The profile lives in `local/source-connection.json`, which is ignored by Git and owner-readable only. Saving does not connect. Once access is supplied, the audit will:

1. List project directories and manifests only.
2. Exclude `.env`, databases, uploads, logs, personal media, account files, and production backups.
3. Produce a capability and licensing shortlist before any code is migrated.
4. Rebuild selected capabilities as removable NovaShell modules with clear data boundaries.
