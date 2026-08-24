"""Permission-bounded Relay artifacts and action history."""

from __future__ import annotations

import html
import json
import os
import re
import time
import uuid
from pathlib import Path


STAGES = {"plan", "preview", "confirm", "result"}
KINDS = {"app", "core", "network", "backup", "restore", "agent"}
BLOCKED_BROWSER_CODE = re.compile(
    r"<\s*/?\s*(script|iframe)|\b(fetch|xmlhttprequest|websocket|eval|document\.cookie)\b|"
    r"\bimport\s*\(|@import|url\s*\(",
    re.I,
)


def _atomic_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")
    os.chmod(temporary, 0o600)
    temporary.replace(path)


def action_history(path: Path, limit: int = 80) -> list[dict]:
    try:
        entries = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(entries, list):
            return []
    except (OSError, ValueError, TypeError):
        return []
    return [entry for entry in entries if isinstance(entry, dict)][-max(1, min(limit, 200)) :]


def record_action(
    path: Path,
    *,
    action_id: str,
    kind: str,
    stage: str,
    title: str,
    detail: str = "",
    state: str = "ok",
    target: str = "",
) -> dict:
    if kind not in KINDS or stage not in STAGES:
        raise ValueError("invalid Relay action stage")
    clean_id = action_id if re.fullmatch(r"[a-z0-9-]{8,80}", action_id or "") else uuid.uuid4().hex
    entry = {
        "id": uuid.uuid4().hex[:12],
        "action_id": clean_id,
        "kind": kind,
        "stage": stage,
        "title": str(title)[:160],
        "detail": str(detail)[:600],
        "state": state if state in {"ok", "working", "failed"} else "ok",
        "target": str(target)[:240],
        "time": int(time.time()),
    }
    entries = action_history(path, 200)
    entries.append(entry)
    _atomic_json(path, entries[-120:])
    return entry


def _clean_slug(value: str) -> str:
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", value.casefold()))[:64] or "relay-app"


def validate_app_parts(app: dict) -> dict:
    name = re.sub(r"\s+", " ", str(app.get("name") or "Untitled app")).strip()[:60]
    parts = {key: str(app.get(key) or "").strip() for key in ("html", "css", "js")}
    if not all(parts.values()):
        raise ValueError("Relay returned an incomplete Web Components draft")
    if any(len(value) > 120_000 for value in parts.values()):
        raise ValueError("Relay returned an oversized app draft")
    if any(BLOCKED_BROWSER_CODE.search(value) for value in parts.values()):
        raise ValueError("Relay generated a browser capability outside the local app contract")
    if not re.search(r"<homebase-generated-app(?:\s[^>]*)?></homebase-generated-app>", parts["html"], re.I):
        raise ValueError("Relay draft must mount one homebase-generated-app component")
    if not re.search(r"customElements\.define\(\s*['\"]homebase-generated-app['\"]", parts["js"]):
        raise ValueError("Relay draft must define the homebase-generated-app Web Component")
    return {
        "name": name,
        "slug": _clean_slug(name),
        "description": str(app.get("description") or "Relay-generated local app.")[:180],
        "icon": str(app.get("icon") or "✦")[:8],
        **parts,
    }


def save_app_draft(draft_root: Path, app: dict, request: str) -> dict:
    draft = validate_app_parts(app)
    draft.update({"id": uuid.uuid4().hex[:16], "request": str(request)[:3000], "created": int(time.time())})
    _atomic_json(draft_root / (draft["id"] + ".json"), draft)
    return app_draft_summary(draft)


def load_app_draft(draft_root: Path, draft_id: str) -> dict:
    if not re.fullmatch(r"[a-f0-9]{16}", draft_id or ""):
        raise ValueError("choose a valid Relay app draft")
    path = draft_root / (draft_id + ".json")
    try:
        draft = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError, TypeError):
        raise ValueError("that Relay app draft is no longer available") from None
    if int(draft.get("created", 0)) < time.time() - 86400:
        raise ValueError("that Relay app draft expired; create a fresh preview")
    return validate_app_parts(draft) | {"id": draft_id, "created": int(draft["created"]), "request": str(draft.get("request", ""))}


def app_draft_summary(draft: dict) -> dict:
    return {
        "id": draft["id"],
        "name": draft["name"],
        "description": draft["description"],
        "icon": draft["icon"],
        "created": draft["created"],
        "files": [
            {"name": "index.html", "bytes": len(draft["html"].encode())},
            {"name": "app.css", "bytes": len(draft["css"].encode())},
            {"name": "app.js", "bytes": len(draft["js"].encode())},
            {"name": "app.json", "bytes": len(json.dumps({"name": draft["name"]}).encode())},
        ],
    }


def preview_document(draft: dict) -> str:
    script = draft["js"].replace("</script", "<\\/script")
    return (
        "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
        "<style>body{margin:0;background:#d4d4d4;color:#111;font:15px system-ui;padding:16px}" + draft["css"] + "</style></head><body>"
        + draft["html"]
        + "<script>" + script + "</script></body></html>"
    )


def install_app_draft(draft_root: Path, user_apps: Path, draft_id: str) -> dict:
    draft = load_app_draft(draft_root, draft_id)
    folder = user_apps / "experiments" / draft["slug"]
    suffix = 2
    while folder.exists():
        folder = user_apps / "experiments" / (draft["slug"] + "-" + str(suffix))
        suffix += 1
    folder.mkdir(parents=True)
    page = (
        "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
        "<title>" + html.escape(draft["name"]) + " · NovaShell</title><link rel=\"stylesheet\" href=\"/assets/styles/shared/ultra-retro.css\">"
        "<link rel=\"stylesheet\" href=\"app.css\"><script src=\"/assets/scripts/shared/theme-sync.js\"></script><script src=\"app.js\" defer></script>"
        "</head><body>" + draft["html"] + "</body></html>"
    )
    manifest = {
        "name": draft["name"],
        "description": draft["description"],
        "icon": draft["icon"],
        "entry": "index.html",
        "framework": "Web Components",
        "generated_by": "Relay reviewed draft",
    }
    (folder / "index.html").write_text(page, encoding="utf-8")
    (folder / "app.css").write_text(draft["css"] + "\n", encoding="utf-8")
    (folder / "app.js").write_text(draft["js"] + "\n", encoding="utf-8")
    (folder / "app.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (draft_root / (draft_id + ".json")).unlink(missing_ok=True)
    return {"id": str(folder.relative_to(user_apps)).replace(os.sep, "/"), **manifest}
