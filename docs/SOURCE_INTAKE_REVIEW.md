# Private source intake review

NovaShell can learn from private source archives and future server audits without importing people’s data, credentials, databases, uploads, analytics, logs, or copyrighted media. The archive itself remains external to this repository.

## Intake rule

Every candidate is assessed for interaction patterns and capability only. A NovaShell module is rebuilt from the product contract and current components; it is not copied as an opaque app. Source code is only reused if its ownership and license are confirmed by the owner, then it is isolated, attributed where required, and stripped of server-specific data.

## Current archive capability audit

| Candidate capability | Safe NovaShell direction |
| --- | --- |
| Music-reactive radio / visual channel deck | Improve Radio Orbit’s visual scenes, station discovery, and lightweight background player without bringing in playlists or account data. |
| Lord of the Rocks / CHIPTOWN 3D engine | Build the optional NovaShell World from the owner-provided Three.js renderer, input layer, world/prop pattern, and NPC interaction model. Replace its unrelated game content with NovaShell rooms and routes; exclude its private Node services, saves, characters, media, and operational files. |
| Map builder / arena prototype | Maker Desk becomes the room/world layout authoring surface for NovaShell World: touch-friendly placement, preview, controller test room, and user-owned project export. No maps or player data are imported. |
| Beat/time manipulation tool | A small offline audio utility: trim/loop markers and visual waveform controls for user-imported tracks, subject to browser capabilities. |
| Hyperlocal weather console | Improve Weather Station’s forecast panels, location detail, and retro presentation using public APIs already cataloged by NovaShell. |
| Markets watchlist | Optional local watchlists and compact sparklines. No trading, brokerage connection, or account synchronization. |
| Graph-like knowledge brain | Extend Relay’s visible Brain browser with local notes, decisions, and module relationships—never private archive notes by default. |
| Generative audiovisual channels | Additional performance-friendly Orbit visualizers, with reduced-motion and Chromebook performance guards. |
| Walkable generated game shelf | NovaShell World now has an approved 3D implementation path: each locally indexed game becomes a cabinet; library, system, Orbit, settings, and Relay become in-world stations. |

## Approved owner-provided 3D migration

The owner has explicitly selected the Node/Three.js project formerly known as **Lord of the Rocks**, now **CHIPTOWN**, from the Benjamin Michael archive. Its client has been reviewed as a complete pixel-3D engine with a low-resolution render target, gamepad/touch input, prop factories, collision, NPC dialogue, local state, and a map editor.

NovaShell World may reuse the isolated client-side engine pattern and the upstream Three.js dependency only. The migration does **not** include the old game's fiction, characters, violence/combat, names, music, hosted multiplayer, cloud saves, server endpoints, prompts, credentials, or non-public operational instructions. Relay is the sole AI NPC: interacting with it uses the already-configured local Relay provider and preserves Relay's existing permission boundary.

## Hosted-server audit status

The FTP audit has been completed at metadata level: 120 top-level candidates and 20 manifest signals. No remote code, media, databases, uploads, logs, or credentials were copied. Candidate patterns were classified into audio/visual, map maker, media viewer, weather, knowledge, and workflow; any future migration requires an owner-selected project plus a content and licensing review before code moves.

## Next audit: hosted server

Open `/pages/source-connection.html` to save an SFTP or FTPS profile locally. The profile lives in `local/source-connection.json`, which is ignored by Git and owner-readable only. Saving does not connect. Once access is supplied, the audit will:

1. List project directories and manifests only.
2. Exclude `.env`, databases, uploads, logs, personal media, account files, and production backups.
3. Produce a capability and licensing shortlist before any code is migrated.
4. Rebuild selected capabilities as removable NovaShell modules with clear data boundaries.
