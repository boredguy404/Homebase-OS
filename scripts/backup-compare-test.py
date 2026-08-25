#!/usr/bin/env python3
"""Disposable proof that restore preview and execution share one decision plan."""
import json
import sys
import tempfile
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from modules.backup.runtime import apply_restore_plan, build_restore_plan, public_restore_plan


with tempfile.TemporaryDirectory(prefix="novashell-backup-test-") as folder:
    root = Path(folder)
    destination = root / "library"
    destination.mkdir()
    (destination / "conflict.txt").write_text("keep-local", encoding="utf-8")
    archive_path = root / "backup.zip"
    manifest = {"format": 1, "areas": ["box"], "preferences": {"nightglass-theme": "ultra-retro"}}
    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("homebase-backup.json", json.dumps(manifest))
        archive.writestr("data/box/conflict.txt", "from-backup")
        archive.writestr("data/box/folder/new.txt", "new-file")
        archive.writestr("data/box/../escape.txt", "never")

    destination_for = lambda _area: destination
    with zipfile.ZipFile(archive_path) as archive:
        skip = build_restore_plan(archive, manifest, {"box": destination}, destination_for, {"box", "preferences"}, False)
        public = public_restore_plan(skip)
        assert public["totals"]["conflicts"] == 1
        assert public["totals"]["preserved"] == 1
        assert public["totals"]["new"] == 1
        assert public["totals"]["blocked"] == 1
        assert not (root / "escape.txt").exists(), "preview extracted a traversal entry"
        preview_fingerprint = public["fingerprint"]
        outcome = apply_restore_plan(archive, skip)
    assert outcome == {"written": 1, "replaced": 0, "preserved": 1, "blocked": 1, "safety_files": 0}
    assert (destination / "conflict.txt").read_text(encoding="utf-8") == "keep-local"
    assert (destination / "folder" / "new.txt").read_text(encoding="utf-8") == "new-file"
    assert not (root / "escape.txt").exists()
    with zipfile.ZipFile(archive_path) as archive:
        changed = build_restore_plan(archive, manifest, {"box": destination}, destination_for, {"box", "preferences"}, False)
    assert changed["fingerprint"] != preview_fingerprint, "destination change did not invalidate the restore preview"

    (destination / "folder" / "new.txt").unlink()
    safety = root / "safety"
    with zipfile.ZipFile(archive_path) as archive:
        replace = build_restore_plan(archive, manifest, {"box": destination}, destination_for, {"box"}, True)
        public = public_restore_plan(replace)
        assert public["totals"]["will_write"] == 2
        assert public["totals"]["will_replace"] == 1
        assert public["safety_backup"] is True
        outcome = apply_restore_plan(archive, replace, safety)
    assert outcome == {"written": 2, "replaced": 1, "preserved": 0, "blocked": 1, "safety_files": 1}
    assert (destination / "conflict.txt").read_text(encoding="utf-8") == "from-backup"
    assert (safety / "box" / "conflict.txt").read_text(encoding="utf-8") == "keep-local"

print("Backup comparison contract passed: preview matches preserve/replace results, traversal stays blocked, and replacement gets a safety copy.")
