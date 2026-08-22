# Homebase app scalability and maintainability contract

Homebase core and user-created apps are separate on purpose.

## Ownership boundary

- `pages/`, `assets/`, `modules/`, and `server.py` are **core Homebase**. Relay must never overwrite them.
- `user-apps/` is the only write location for Relay-generated apps.
- Every user app is a self-contained folder with `app.json` and an `index.html` entry point.
- An app can be backed up, copied in, reviewed, or removed as one folder.

## Semantic taxonomy

Keep user apps in named folders as the collection grows:

```text
user-apps/
├── utilities/       # weather, converters, timers, device helpers
├── productivity/    # notes, boards, trackers, planners
├── media/           # album helpers, radio companions, visual tools
├── games/           # local game companion tools, never ROMs
├── reference/       # local readers and lookup tools
└── experiments/     # prototypes awaiting promotion or removal
```

The current `weather-station/` is a compact example app. New Relay work should use a taxonomy folder, then expose its `app.json` through `/api/user-apps`.

## App manifest

`app.json` is the durable contract between an app, Homebase, Relay, backups, and the desktop launcher:

```json
{
  "name": "Weather Station",
  "description": "Short touch-friendly summary.",
  "icon": "☼",
  "entry": "index.html"
}
```

Keep descriptions short, entries relative, and assets inside the app folder. Use browser `localStorage` for lightweight private state; do not put credentials in app files.

## Relay generation rules

1. Relay requires the optional local API key to generate code.
2. Generated output must be reviewable plain HTML/CSS/JS, with no external scripts, iframes, network calls, dynamic imports, `eval`, or access to Homebase core files.
3. Relay creates a new folder instead of silently overwriting an app.
4. Deleting an app requires two explicit confirmations and only removes that app folder.
5. A generated app should remain usable offline unless its manifest explicitly says otherwise.

## Change contract

- Add fields to `app.json` compatibly; do not rename required fields.
- Keep APIs versionless only while they are local and internal; document a migration before changing a response shape.
- Each app should be independently deletable and should fail closed if an optional remote API is unavailable.
- Add only one responsibility per module: page UI, client behavior, server endpoint, or local asset—not all four in one file.
- Update the README screenshot and the app manifest when a user-facing app changes materially.
