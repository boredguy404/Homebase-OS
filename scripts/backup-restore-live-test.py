#!/usr/bin/env python3
"""Live disposable inspect/merge rehearsal against the local NovaShell helper."""
import io
import json
import shutil
import sys
import tempfile
import time
import urllib.error
import urllib.request
import uuid
import zipfile
from pathlib import Path

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8765").rstrip("/")
name = ".novashell-restore-rehearsal-" + uuid.uuid4().hex[:10]
library = Path.home() / "My Library"
target = library / name
trash = Path.home() / ".local" / "share" / "Trash" / "files" / (name + "-" + str(int(time.time())))


def post(path: str, body: bytes, headers: dict[str, str]):
    request = urllib.request.Request(BASE + path, data=body, method="POST", headers={"Sec-Fetch-Site": "same-origin", **headers})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, json.load(error)


try:
    target.mkdir(parents=True)
    (target / "conflict.txt").write_text("keep-local", encoding="utf-8")
    memory = io.BytesIO()
    with zipfile.ZipFile(memory, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("homebase-backup.json", json.dumps({"format": 1, "created": int(time.time()), "areas": ["box"], "preferences": {}, "installed_apps": []}))
        archive.writestr(f"data/box/{name}/conflict.txt", "from-backup")
        archive.writestr(f"data/box/{name}/new.txt", "new-from-backup")
    body = memory.getvalue()
    inspect_headers = {"Content-Type": "application/zip", "X-Homebase-Areas": "box", "X-Homebase-Conflict": "skip"}
    status, preview = post("/api/backup/inspect", body, inspect_headers)
    assert status == 200, preview
    totals = preview["comparison"]["totals"]
    assert (totals["new"], totals["conflicts"], totals["preserved"], totals["will_write"]) == (1, 1, 1, 1), totals
    assert not (target / "new.txt").exists(), "inspection extracted a file"

    (target / "conflict.txt").write_text("changed-after-preview", encoding="utf-8")
    stale_headers = {**inspect_headers, "X-Relay-Action": preview["action_id"], "X-Homebase-Preview": preview["comparison"]["fingerprint"]}
    status, stale = post("/api/backup/import", body, stale_headers)
    assert status == 400 and "changed after preview" in stale.get("error", ""), stale
    assert not (target / "new.txt").exists(), "stale plan wrote a file"

    status, preview = post("/api/backup/inspect", body, {**inspect_headers, "X-Relay-Action": preview["action_id"]})
    assert status == 200, preview
    apply_headers = {**inspect_headers, "X-Relay-Action": preview["action_id"], "X-Homebase-Preview": preview["comparison"]["fingerprint"]}
    status, result = post("/api/backup/import", body, apply_headers)
    assert status == 200, result
    assert (result["written"], result["skipped"], result["replaced"], result["blocked"]) == (1, 1, 0, 0), result
    assert (target / "conflict.txt").read_text(encoding="utf-8") == "changed-after-preview"
    assert (target / "new.txt").read_text(encoding="utf-8") == "new-from-backup"
    print("Live restore rehearsal passed: preview was read-only, stale approval was rejected, and preserve-mode results matched the refreshed comparison.")
finally:
    if target.exists():
        trash.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(target), str(trash))
        print("Disposable rehearsal folder moved to Trash for recovery.")
