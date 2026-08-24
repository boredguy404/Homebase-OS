#!/usr/bin/env python3
"""Deterministic contract test for the read-only cleanup/recovery report."""

import json
import os
import sys
import tempfile
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


with tempfile.TemporaryDirectory(prefix="novashell-recovery-") as folder:
    root = Path(folder)
    home = root / "home"
    project = root / "project"
    downloads = home / "Downloads"
    trash = home / ".local" / "share" / "Trash" / "files"
    downloads.mkdir(parents=True)
    trash.mkdir(parents=True)
    project.mkdir()

    old_file = downloads / "old-download.bin"
    old_file.write_bytes(b"o" * 32)
    old_time = time.time() - 120 * 86400
    os.utime(old_file, (old_time, old_time))
    (downloads / "current-download.bin").write_bytes(b"n" * 16)
    (trash / "recoverable.bin").write_bytes(b"t" * 24)

    backup_status = project / "local" / "backup-status.json"
    backup_status.parent.mkdir()
    backup_status.write_text(json.dumps({"last_export": 1700000000, "areas": ["box", "invalid"], "bytes": 2048}), encoding="utf-8")

    server.HOME_ROOT = home
    server.ROOT = project
    server.BACKUP_STATUS_FILE = backup_status
    server.BACKUP_AREAS = {"box": home / "My Library"}
    server.INSIGHT_CACHE = {"time": 0, "data": None}
    report = server.system_insights()["recovery"]

    assert report["stale_downloads"] == {"count": 1, "bytes": 32, "age_days": 90}
    assert report["trash"] == {"count": 1, "bytes": 24}
    assert report["backup"] == {"last_export": 1700000000, "areas": ["box"], "bytes": 2048}

print("Recovery insight contract passed: stale Downloads, Trash, and backup status stay read-only and bounded.")
