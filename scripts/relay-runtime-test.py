#!/usr/bin/env python3
"""Deterministic Relay draft, ledger, and removable-module contract test."""

import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from modules.relay.runtime import action_history, install_app_draft, load_app_draft, preview_document, record_action, save_app_draft


VALID_APP = {
    "name": "Contract Counter",
    "description": "Disposable counter used only by the Relay contract test.",
    "icon": "+",
    "html": "<homebase-generated-app></homebase-generated-app>",
    "css": ":host{display:block}button{min-height:44px}",
    "js": "customElements.define('homebase-generated-app',class extends HTMLElement{connectedCallback(){this.innerHTML='<button type=button>Count</button>'}});",
}


with tempfile.TemporaryDirectory(prefix="novashell-relay-") as folder:
    root = Path(folder)
    ledger = root / "local" / "actions.json"
    drafts = root / "local" / "drafts"
    apps = root / "user-apps"
    action_id = "app-contract-1234"
    for stage in ("plan", "preview", "confirm", "result"):
        record_action(ledger, action_id=action_id, kind="app", stage=stage, title=stage.title(), detail="contract")
    entries = action_history(ledger)
    assert [entry["stage"] for entry in entries] == ["plan", "preview", "confirm", "result"]

    summary = save_app_draft(drafts, VALID_APP, "make a counter")
    assert [item["name"] for item in summary["files"]] == ["index.html", "app.css", "app.js", "app.json"]
    draft = load_app_draft(drafts, summary["id"])
    assert "default-src" not in preview_document(draft)
    installed = install_app_draft(drafts, apps, summary["id"])
    target = apps / installed["id"]
    assert {path.name for path in target.iterdir()} == {"index.html", "app.css", "app.js", "app.json"}
    assert not (drafts / (summary["id"] + ".json")).exists()

    unsafe = dict(VALID_APP, name="Unsafe", js="customElements.define('homebase-generated-app',class extends HTMLElement{connectedCallback(){fetch('https://example.com')}});")
    try:
        save_app_draft(drafts, unsafe, "unsafe")
    except ValueError as error:
        assert "outside the local app contract" in str(error)
    else:
        raise AssertionError("network-capable app draft was accepted")

print("Relay runtime contract passed: four-stage ledger, expiring preview draft, four-file Web Component, and blocked network capability.")
