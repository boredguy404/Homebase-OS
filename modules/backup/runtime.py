"""Read-only comparison and safe application for NovaShell backup archives."""
from __future__ import annotations

import os
import hashlib
import json
import shutil
import tempfile
from pathlib import Path, PurePosixPath
from typing import Callable
from zipfile import ZipFile, ZipInfo

MAX_ENTRIES = 200_000
MAX_UNCOMPRESSED_BYTES = 128 * 1024**3
SAMPLE_LIMIT = 8


def _is_symlink(info: ZipInfo) -> bool:
    return ((info.external_attr >> 16) & 0o170000) == 0o120000


def _safe_relative(name: str, prefix: str) -> Path | None:
    if not name.startswith(prefix) or name.endswith("/"):
        return None
    value = PurePosixPath(name[len(prefix):])
    if not value.parts or value.is_absolute() or ".." in value.parts or "" in value.parts:
        return None
    return Path(*value.parts)


def build_restore_plan(
    archive: ZipFile,
    manifest: dict,
    backup_areas: dict[str, Path],
    destination_for: Callable[[str], Path],
    requested: set[str] | None = None,
    replace: bool = False,
) -> dict:
    """Return the exact validated file decisions a restore would execute."""
    requested = requested or set()
    selected = [key for key in manifest.get("areas", []) if key in backup_areas and (not requested or key in requested)]
    groups = {key: {"id": key, "files": 0, "new": 0, "conflicts": 0, "will_write": 0, "will_replace": 0, "preserved": 0, "blocked": 0, "bytes": 0, "samples": []} for key in selected}
    entries: list[dict] = []
    infos = archive.infolist()
    if len(infos) > MAX_ENTRIES:
        raise ValueError("backup contains too many entries")
    total_uncompressed = sum(max(0, info.file_size) for info in infos)
    if total_uncompressed > MAX_UNCOMPRESSED_BYTES:
        raise ValueError("backup expands beyond the local safety limit")

    for key in selected:
        destination = destination_for(key).resolve()
        prefix = f"data/{key}/"
        for info in infos:
            if not info.filename.startswith(prefix) or info.filename.endswith("/"):
                continue
            relative = _safe_relative(info.filename, prefix)
            if relative is None:
                group = groups[key]
                group["files"] += 1
                group["blocked"] += 1
                group["bytes"] += max(0, info.file_size)
                display_path = info.filename[len(prefix):] or "unsafe archive entry"
                if len(group["samples"]) < SAMPLE_LIMIT:
                    group["samples"].append({"path": display_path, "status": "blocked", "bytes": max(0, info.file_size)})
                entries.append({"area": key, "zip_name": info.filename, "relative": Path("__blocked__"), "target": None, "status": "blocked", "bytes": max(0, info.file_size), "crc": info.CRC, "target_signature": None})
                continue
            group = groups[key]
            group["files"] += 1
            group["bytes"] += max(0, info.file_size)
            target = (destination / relative).resolve(strict=False)
            status = "new"
            if _is_symlink(info) or not target.is_relative_to(destination):
                status = "blocked"
            elif target.exists() and not target.is_file():
                status = "blocked"
            elif target.exists():
                status = "replace" if replace else "preserve"
                group["conflicts"] += 1
            if status == "new":
                group["new"] += 1
                group["will_write"] += 1
            elif status == "replace":
                group["will_write"] += 1
                group["will_replace"] += 1
            elif status == "preserve":
                group["preserved"] += 1
            else:
                group["blocked"] += 1
            if len(group["samples"]) < SAMPLE_LIMIT:
                group["samples"].append({"path": relative.as_posix(), "status": status, "bytes": max(0, info.file_size)})
            target_signature = None
            if target.is_file():
                stat = target.stat()
                target_signature = [stat.st_size, stat.st_mtime_ns]
            entries.append({"area": key, "zip_name": info.filename, "relative": relative, "target": target, "status": status, "bytes": max(0, info.file_size), "crc": info.CRC, "target_signature": target_signature})

    preference_selected = bool(manifest.get("preferences")) and (not requested or "preferences" in requested)
    public_groups = list(groups.values())
    if preference_selected:
        public_groups.append({"id": "preferences", "files": 1, "new": 0, "conflicts": 0, "will_write": 1, "will_replace": 0, "preserved": 0, "blocked": 0, "bytes": 0, "samples": [{"path": "Browser preferences", "status": "merge", "bytes": 0}]})
    totals = {key: sum(group[key] for group in public_groups) for key in ("files", "new", "conflicts", "will_write", "will_replace", "preserved", "blocked", "bytes")}
    contract = [{"area": entry["area"], "path": entry["relative"].as_posix(), "status": entry["status"], "bytes": entry["bytes"], "crc": entry["crc"], "target": entry["target_signature"]} for entry in entries]
    fingerprint = hashlib.sha256(json.dumps({"entries": contract, "preferences": preference_selected, "replace": replace}, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    return {"entries": entries, "groups": public_groups, "totals": totals, "selected": selected, "preferences": preference_selected, "replace": replace, "fingerprint": fingerprint}


def public_restore_plan(plan: dict) -> dict:
    return {"groups": plan["groups"], "totals": plan["totals"], "replace": plan["replace"], "mode": "replace" if plan["replace"] else "preserve", "safety_backup": bool(plan["replace"] and plan["totals"]["will_replace"]), "fingerprint": plan["fingerprint"]}


def apply_restore_plan(archive: ZipFile, plan: dict, safety_root: Path | None = None) -> dict:
    """Apply only decisions already present in a validated restore plan."""
    written = replaced = preserved = blocked = 0
    safety_files = 0
    for entry in plan["entries"]:
        status = entry["status"]
        if status == "preserve":
            preserved += 1
            continue
        if status == "blocked":
            blocked += 1
            continue
        target: Path = entry["target"]
        target.parent.mkdir(parents=True, exist_ok=True)
        if status == "replace":
            if safety_root is None:
                raise ValueError("replacement requires a safety-backup destination")
            safety = safety_root / entry["area"] / entry["relative"]
            safety.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(target, safety)
            safety_files += 1
            replaced += 1
        temporary = None
        try:
            with archive.open(entry["zip_name"]) as source, tempfile.NamedTemporaryFile("wb", dir=target.parent, prefix=f".{target.name}-", delete=False) as output:
                temporary = Path(output.name)
                shutil.copyfileobj(source, output)
            os.chmod(temporary, 0o600)
            temporary.replace(target)
        finally:
            if temporary and temporary.exists():
                temporary.unlink()
        written += 1
    return {"written": written, "replaced": replaced, "preserved": preserved, "blocked": blocked, "safety_files": safety_files}
