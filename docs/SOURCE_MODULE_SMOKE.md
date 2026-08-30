# Source module smoke check

Run this after starting NovaShell's local helper and before calling a build
stable when a removable source-informed module has changed:

```bash
bash scripts/source-module-smoke.sh
```

The check reads every `user-apps/**/app.json`, confirms a safe relative entry,
confirms that entry exists, runs `node --check` for that app's JavaScript, and
expects the local helper to return HTTP 200 for the declared entry. It does not
read app storage, imported source archives, personal files, credentials, or
network-provider data.

Pass a different local URL only for an intentional local test environment:

```bash
bash scripts/source-module-smoke.sh http://127.0.0.1:8765
```

This is a contract smoke test, not a substitute for focused UI and hardware
checks when a module changes its controls, visual output, or local data model.
