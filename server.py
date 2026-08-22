#!/usr/bin/env python3
import json
import os
import shutil
import subprocess
import configparser
import mimetypes
import re
import urllib.parse
import urllib.request
import tempfile
import io
import zipfile
import time
import threading
import uuid
from functools import lru_cache
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HOME_ROOT = Path.home().resolve()
LAUNCHER = ROOT / "scripts/games/launch-gba-versus.sh"
ALLOWED = {"mario", "streetfighter"}
ACTIONS = {
    "files": ["thunar", str(HOME_ROOT)],
    "terminal": ["xfce4-terminal", "--working-directory=" + str(HOME_ROOT)],
    "code": ["code", "--new-window", str(HOME_ROOT)],
    "codex": ["xfce4-terminal", "--working-directory=" + str(HOME_ROOT), "--command=codex"],
    "github_login": ["xfce4-terminal", "--working-directory=" + str(HOME_ROOT), "--command=bash -lc 'gh auth login; exec bash'"],
    "radio": [str(ROOT / "modules/radio-orbit/launch-radio-orbit.sh")],
    "radio_embed": [str(ROOT / "modules/radio-orbit/launch-radio-embed.sh")],
    "nightglass": [str(ROOT / "modules/homebase-control/launch.sh")],
    "nightglass_embed": [str(ROOT / "modules/homebase-control/launch-embed.sh")],
    "doom": [str(ROOT / "scripts/games/launch-doom-hd.sh")],
    "steamlink": ["garcon-url-handler", "steamlink://"],
    "supertuxkart": ["supertuxkart", "--fullscreen"],
    "luanti": ["minetest"],
    "minecraft": ["flatpak", "run", "io.mrarm.mcpelauncher"],
}
CATALOG_CACHE = {}
INSIGHT_CACHE = {"time": 0, "data": None}
JOBS = {}
JOBS_LOCK = threading.Lock()
BACKUP_AREAS = {"box": HOME_ROOT / "My Library", "roms": ROOT / "roms", "saves": ROOT / "saves", "artwork": ROOT / "covers", "imports": ROOT / "imports", "mgba": HOME_ROOT / ".config" / "mgba", "orbit": HOME_ROOT / ".config" / "radio-orbit", "flatpak": HOME_ROOT / ".var" / "app"}

def start_job(kind, app_id, command):
    job_id = uuid.uuid4().hex[:12]
    job = {"id": job_id, "kind": kind, "app_id": app_id, "status": "queued", "output": "", "started": int(time.time())}
    with JOBS_LOCK:
        JOBS[job_id] = job
    def run():
        with JOBS_LOCK:
            job["status"] = "running"
        try:
            result = subprocess.run(command, cwd=str(ROOT), capture_output=True, text=True,
                timeout=1800, env={**os.environ, "DISPLAY": os.environ.get("DISPLAY", ":0")})
            output = (result.stdout + "\n" + result.stderr).strip()[-8000:]
            installed = app_id in flatpak_scopes()
            confirmed = installed if kind == "install" else not installed
            with JOBS_LOCK:
                job.update(status="succeeded" if result.returncode == 0 and confirmed else "failed",
                    output=output, exit_code=result.returncode, installed=installed, finished=int(time.time()))
        except (OSError, subprocess.TimeoutExpired) as error:
            with JOBS_LOCK:
                job.update(status="failed", output=str(error), installed=False, finished=int(time.time()))
    threading.Thread(target=run, daemon=True, name="homebase-job-" + job_id).start()
    return job

def system_insights():
    import time
    if INSIGHT_CACHE["data"] and time.time() - INSIGHT_CACHE["time"] < 45:
        return INSIGHT_CACHE["data"]
    groups = {"My Library": HOME_ROOT / "My Library", "Downloads": HOME_ROOT / "Downloads",
              "Games": ROOT / "roms", "Artwork": ROOT / "covers", "Imports": ROOT / "imports"}
    composition, largest = {}, []
    for label, folder in groups.items():
        total = 0
        if folder.exists():
            for base, dirs, files in os.walk(folder):
                dirs[:] = [name for name in dirs if not name.startswith(".") and name not in {"emulatorjs", "node_modules"}]
                for name in files:
                    path = Path(base) / name
                    try:
                        amount = path.stat().st_size; total += amount
                        largest.append({"name": name, "path": str(path.relative_to(HOME_ROOT)), "bytes": amount})
                    except OSError: pass
        composition[label] = total
    output = subprocess.run(
        ["ps", "-eo", "pid=,comm=,%cpu=,%mem=,rss=,etimes=", "--sort=-%cpu"],
        capture_output=True, text=True, timeout=5
    ).stdout.splitlines()[:18]
    processes = []
    for line in output:
        fields = line.split()
        if len(fields) >= 6:
            processes.append({"pid": int(fields[0]), "name": fields[1],
                              "cpu": float(fields[2]), "memory_percent": float(fields[3]),
                              "mb": round(int(fields[4]) / 1024, 1), "seconds": int(fields[5])})
    disk = shutil.disk_usage(HOME_ROOT)
    with open("/proc/meminfo", encoding="utf-8") as handle:
        memory = {line.split(":", 1)[0]: int(line.split()[1]) * 1024 for line in handle
                  if line.split()[0].rstrip(":") in {"MemTotal", "MemAvailable", "SwapTotal", "SwapFree"}}
    data = {"composition": composition, "largest": sorted(largest, key=lambda item:item["bytes"], reverse=True)[:16],
            "processes": processes, "cpu_count": os.cpu_count() or 1, "load": list(os.getloadavg()),
            "memory": memory, "disk": {"total": disk.total, "used": disk.used, "free": disk.free},
            "uptime_seconds": int(float(Path("/proc/uptime").read_text().split()[0]))}
    INSIGHT_CACHE.update(time=time.time(), data=data); return data

def safe_home_path(raw=""):
    raw = urllib.parse.unquote(raw or "").lstrip("/")
    target = (HOME_ROOT / raw).resolve()
    return target if target == HOME_ROOT or target.is_relative_to(HOME_ROOT) else None

APP_DIRS = [Path("/usr/share/applications"), Path.home() / ".local/share/applications",
            Path.home() / ".local/share/flatpak/exports/share/applications",
            Path("/var/lib/flatpak/exports/share/applications")]


def installed_apps():
    apps = {}
    for folder in APP_DIRS:
        for desktop in folder.glob("*.desktop"):
            try:
                data = configparser.ConfigParser(interpolation=None, strict=False)
                data.read(desktop, encoding="utf-8")
                entry = data["Desktop Entry"]
                if entry.get("Type") != "Application" or entry.getboolean("NoDisplay", fallback=False):
                    continue
                name = entry.get("Name", desktop.stem).strip()
                apps[desktop.stem] = {"id": desktop.stem, "name": name, "path": str(desktop),
                                      "icon": entry.get("Icon", "")}
            except (OSError, configparser.Error):
                continue
    return dict(sorted(apps.items(), key=lambda item: item[1]["name"].casefold()))


def flatpak_scopes():
    scopes = {}
    for scope in ("user", "system"):
        result = subprocess.run(["flatpak", f"--{scope}", "list", "--app", "--columns=application"],
                                capture_output=True, text=True, check=False)
        scopes.update({app_id: scope for app_id in result.stdout.splitlines()})
    return scopes


@lru_cache(maxsize=1)
def icon_index():
    roots = [Path.home() / ".local/share/icons", Path.home() / ".local/share/flatpak/exports/share/icons",
             Path("/var/lib/flatpak/exports/share/icons"), Path("/usr/share/icons"), Path("/usr/share/pixmaps")]
    index = {}
    for root in roots:
        if root.exists():
            for path in root.rglob("*"):
                if path.is_file() and path.suffix.lower() in {".png", ".svg", ".xpm"}:
                    for key in {path.name.casefold(), path.stem.casefold()}:
                        old = index.get(key)
                        if old is None or path.stat().st_size > old.stat().st_size:
                            index[key] = path
    return index


def resolve_icon(value):
    if not value:
        return None
    direct = Path(value)
    if direct.is_file():
        return direct
    return icon_index().get(Path(value).name.casefold()) or icon_index().get(Path(value).stem.casefold())


class PocketArchiveHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        return

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _json(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/status":
            self._json(200, {"service": "homebase-v57", "multiplayer": True})
            return
        if self.path == "/api/github-status":
            if not shutil.which("gh"):
                self._json(200, {"connected": False, "installed": False, "message": "GitHub CLI is not installed"})
                return
            check = subprocess.run(["gh", "auth", "status"], capture_output=True, text=True, timeout=8)
            output = (check.stdout + check.stderr).strip()
            match = re.search(r"account\s+([^\s]+)", output, re.I)
            self._json(200, {"connected": check.returncode == 0, "installed": True,
                             "account": match.group(1) if match else "", "message": output[-500:]})
            return
        if self.path == "/api/system":
            disk = shutil.disk_usage(HOME_ROOT)
            with open("/proc/meminfo", encoding="utf-8") as handle:
                memory = {line.split(":", 1)[0]: int(line.split()[1]) for line in handle if line.split()[0].rstrip(":") in {"MemTotal", "MemAvailable"}}
            self._json(200, {
                "disk_free_gb": round(disk.free / 1024 ** 3, 1),
                "memory_used_percent": round((1 - memory["MemAvailable"] / memory["MemTotal"]) * 100),
                "load": round(os.getloadavg()[0], 2),
            })
            return
        if self.path == "/api/insights":
            self._json(200, system_insights())
            return
        if self.path == "/api/controllers":
            devices = list(Path("/dev/input").glob("js*")) if Path("/dev/input").exists() else []
            self._json(200, {"linux_controllers": len(devices), "ready_for_native_multiplayer": len(devices) >= 2})
            return
        if self.path.startswith("/api/jobs/"):
            job_id = self.path[len("/api/jobs/"):]
            with JOBS_LOCK:
                job = dict(JOBS.get(job_id, {}))
            self._json(200 if job else 404, job or {"error": "job not found"})
            return
        if urllib.parse.urlsplit(self.path).path == "/api/orbit-stations":
            query = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query).get("q", [""])[0][:80]
            params = urllib.parse.urlencode({"limit": 60, "hidebroken": "true", "order": "clickcount",
                                             "reverse": "true", "name": query})
            request = urllib.request.Request("https://de1.api.radio-browser.info/json/stations/search?" + params,
                                             headers={"User-Agent": "Homebase-Orbit/1.0", "Accept": "application/json"})
            try:
                with urllib.request.urlopen(request, timeout=12) as response:
                    self._json(200, json.load(response))
            except (OSError, ValueError) as error:
                self._json(502, {"error": str(error)})
            return
        if self.path == "/api/apps":
            flatpaks = flatpak_scopes()
            self._json(200, [{"id": app["id"], "name": app["name"], "icon": "/api/app-icon/" + app["id"],
                              "uninstallable": app["id"] in flatpaks}
                             for app in installed_apps().values()])
            return
        route = urllib.parse.urlsplit(self.path)
        if route.path == "/api/backup/export":
            length=min(int(self.headers.get("Content-Length","0")),5*1024*1024)
            try: payload=json.loads(self.rfile.read(length) or b"{}")
            except ValueError: self._json(400,{"error":"invalid settings"});return
            selected=[key for key in payload.get("areas",[]) if key in BACKUP_AREAS];memory=io.BytesIO()
            with zipfile.ZipFile(memory,"w",zipfile.ZIP_DEFLATED,compresslevel=5) as archive:
                archive.writestr("homebase-backup.json",json.dumps({"format":1,"created":int(time.time()),"areas":selected,"preferences":payload.get("preferences",{}),"installed_apps":[{"id":app["id"],"name":app["name"]} for app in installed_apps().values()]},indent=2))
                for key in selected:
                    folder=BACKUP_AREAS[key]
                    if folder.exists():
                        for path in folder.rglob("*"):
                            if path.is_file(): archive.write(path,"data/"+key+"/"+str(path.relative_to(folder)))
            body=memory.getvalue();self.send_response(200);self.send_header("Content-Type","application/zip");self.send_header("Content-Disposition",'attachment; filename="homebase-backup.zip"');self.send_header("Content-Length",str(len(body)));self.end_headers();self.wfile.write(body);return
        if route.path == "/api/backup/inspect":
            length=min(int(self.headers.get("Content-Length","0")),16*1024**3)
            try:
                with zipfile.ZipFile(io.BytesIO(self.rfile.read(length))) as archive:
                    manifest=json.loads(archive.read("homebase-backup.json"))
                self._json(200,{"areas":manifest.get("areas",[]),"created":manifest.get("created"),"installed_apps":manifest.get("installed_apps",[]),"has_preferences":bool(manifest.get("preferences"))})
            except (zipfile.BadZipFile,KeyError,ValueError,OSError) as error:self._json(400,{"error":str(error)})
            return
        if route.path == "/api/backup/import":
            length=min(int(self.headers.get("Content-Length","0")),16*1024**3)
            try:
                with zipfile.ZipFile(io.BytesIO(self.rfile.read(length))) as archive:
                    manifest=json.loads(archive.read("homebase-backup.json"));restored=[];skipped=[]
                    requested={key for key in self.headers.get("X-Homebase-Areas","").split(",") if key};replace=self.headers.get("X-Homebase-Conflict")=="replace"
                    for key in manifest.get("areas",[]):
                        if key not in BACKUP_AREAS or requested and key not in requested: continue
                        destination=BACKUP_AREAS[key];destination.mkdir(parents=True,exist_ok=True);prefix="data/"+key+"/"
                        for name in archive.namelist():
                            relative=Path(name[len(prefix):]) if name.startswith(prefix) else None
                            if not relative or name.endswith("/") or relative.is_absolute() or ".." in relative.parts: continue
                            target=destination/relative
                            if target.exists() and not replace: skipped.append(str(relative));continue
                            target.parent.mkdir(parents=True,exist_ok=True)
                            with archive.open(name) as source,target.open("wb") as output: shutil.copyfileobj(source,output)
                        restored.append(key)
                preferences=manifest.get("preferences",{}) if not requested or "preferences" in requested else {}
                self._json(200,{"restored":restored,"skipped":len(skipped),"preferences":preferences,"installed_apps":manifest.get("installed_apps",[])})
            except (zipfile.BadZipFile,KeyError,ValueError,OSError) as error:self._json(400,{"error":str(error)})
            return
        if route.path == "/api/files":
            raw = urllib.parse.parse_qs(route.query).get("path", ["Desktop"])[0]
            folder = safe_home_path(raw)
            if not folder or not folder.is_dir():
                self._json(404, {"error": "folder not found"})
                return
            entries = []
            try:
                for item in sorted(folder.iterdir(), key=lambda p: (not p.is_dir(), p.name.casefold())):
                    if item.name.startswith("."):
                        continue
                    stat = item.stat()
                    entries.append({"name": item.name, "path": str(item.relative_to(HOME_ROOT)),
                        "directory": item.is_dir(), "size": stat.st_size, "modified": int(stat.st_mtime),
                        "mime": mimetypes.guess_type(item.name)[0] or "application/octet-stream"})
                self._json(200, {"path": str(folder.relative_to(HOME_ROOT)) if folder != HOME_ROOT else "",
                    "parent": str(folder.parent.relative_to(HOME_ROOT)) if folder != HOME_ROOT else None,
                    "entries": entries})
            except OSError as error:
                self._json(500, {"error": str(error)})
            return
        if route.path == "/api/file":
            raw = urllib.parse.parse_qs(route.query).get("path", [""])[0]
            file_path = safe_home_path(raw)
            if not file_path or not file_path.is_file():
                self.send_error(404)
                return
            try:
                size = file_path.stat().st_size
                self.send_response(200)
                self.send_header("Content-Type", mimetypes.guess_type(file_path.name)[0] or "application/octet-stream")
                self.send_header("Content-Length", str(size))
                self.send_header("Content-Disposition", "inline; filename*=UTF-8''" + urllib.parse.quote(file_path.name))
                self.end_headers()
                with file_path.open("rb") as handle:
                    shutil.copyfileobj(handle, self.wfile)
            except (OSError, BrokenPipeError):
                pass
            return
        if self.path.startswith("/api/app-icon/"):
            app = installed_apps().get(urllib.parse.unquote(self.path[len("/api/app-icon/"):]))
            icon = (resolve_icon(app["icon"]) or resolve_icon(app["id"])) if app else None
            if not icon:
                self.send_error(404)
                return
            body = icon.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", mimetypes.guess_type(icon.name)[0] or "application/octet-stream")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "public, max-age=86400")
            self.end_headers()
            self.wfile.write(body)
            return
        if urllib.parse.urlsplit(self.path).path == "/api/catalog":
            query = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query).get("q", ["popular"])[0][:80]
            cached = CATALOG_CACHE.get(("search", query.casefold()))
            if cached:
                self._json(200, cached)
                return
            request = urllib.request.Request("https://flathub.org/api/v2/search",
                data=json.dumps({"query": query, "filters": []}).encode(),
                headers={"Content-Type": "application/json", "User-Agent": "Homebase/1.0"})
            try:
                with urllib.request.urlopen(request, timeout=12) as response:
                    hits = json.load(response).get("hits", [])
                result = [{key: app.get(key) for key in ("app_id", "name", "summary", "icon", "developer_name",
                           "verification_verified", "installs_last_month", "main_categories")}
                          for app in hits if "aarch64" in app.get("arches", [])][:60]
                CATALOG_CACHE[("search", query.casefold())] = result
                self._json(200, result)
            except (OSError, ValueError) as error:
                self._json(502, {"error": str(error)})
            return
        if self.path.startswith("/api/catalog-detail/"):
            app_id = urllib.parse.unquote(self.path[len("/api/catalog-detail/"):])
            if not re.fullmatch(r"[A-Za-z0-9_.-]+", app_id):
                self._json(400, {"error": "invalid app id"})
                return
            try:
                request = urllib.request.Request("https://flathub.org/api/v2/appstream/" + app_id,
                    headers={"User-Agent": "Nightglass/1.0"})
                with urllib.request.urlopen(request, timeout=12) as response:
                    app = json.load(response)
                shots = []
                for shot in app.get("screenshots", [])[:6]:
                    sizes = shot.get("sizes", [])
                    image = next((item.get("src") for item in sizes if item.get("width") == "624"), None)
                    if not image and sizes:
                        image = sizes[-1].get("src")
                    if image:
                        shots.append({"src": image, "caption": shot.get("caption", "")})
                self._json(200, {"app_id": app_id, "name": app.get("name"), "summary": app.get("summary"),
                    "description": app.get("description"), "developer_name": app.get("developer_name"),
                    "icon": app.get("icon"), "screenshots": shots})
            except (OSError, ValueError) as error:
                self._json(502, {"error": str(error)})
            return
        super().do_GET()

    def do_POST(self):
        if self.headers.get("Sec-Fetch-Site") not in {"same-origin", "none"}:
            self._json(403, {"error": "same-origin action required"})
            return
        route = urllib.parse.urlsplit(self.path)
        if route.path == "/api/backup/export":
            length=min(int(self.headers.get("Content-Length","0")),5*1024*1024)
            try: payload=json.loads(self.rfile.read(length) or b"{}")
            except ValueError: self._json(400,{"error":"invalid settings"});return
            selected=[key for key in payload.get("areas",[]) if key in BACKUP_AREAS];memory=io.BytesIO()
            with zipfile.ZipFile(memory,"w",zipfile.ZIP_DEFLATED,compresslevel=5) as archive:
                archive.writestr("homebase-backup.json",json.dumps({"format":1,"created":int(time.time()),"areas":selected,"preferences":payload.get("preferences",{}),"installed_apps":[{"id":app["id"],"name":app["name"]} for app in installed_apps().values()]},indent=2))
                for key in selected:
                    folder=BACKUP_AREAS[key]
                    if folder.exists():
                        for path in folder.rglob("*"):
                            if path.is_file(): archive.write(path,"data/"+key+"/"+str(path.relative_to(folder)))
            body=memory.getvalue();self.send_response(200);self.send_header("Content-Type","application/zip");self.send_header("Content-Disposition",'attachment; filename="homebase-backup.zip"');self.send_header("Content-Length",str(len(body)));self.end_headers();self.wfile.write(body);return
        if route.path == "/api/backup/import":
            length=min(int(self.headers.get("Content-Length","0")),16*1024**3)
            try:
                with zipfile.ZipFile(io.BytesIO(self.rfile.read(length))) as archive:
                    manifest=json.loads(archive.read("homebase-backup.json"));restored=[]
                    for key in manifest.get("areas",[]):
                        if key not in BACKUP_AREAS: continue
                        destination=BACKUP_AREAS[key];destination.mkdir(parents=True,exist_ok=True);prefix="data/"+key+"/"
                        for name in archive.namelist():
                            relative=Path(name[len(prefix):]) if name.startswith(prefix) else None
                            if not relative or name.endswith("/") or relative.is_absolute() or ".." in relative.parts: continue
                            target=destination/relative;target.parent.mkdir(parents=True,exist_ok=True)
                            with archive.open(name) as source,target.open("wb") as output: shutil.copyfileobj(source,output)
                        restored.append(key)
                self._json(200,{"restored":restored,"preferences":manifest.get("preferences",{}),"installed_apps":manifest.get("installed_apps",[])})
            except (zipfile.BadZipFile,KeyError,ValueError,OSError) as error:self._json(400,{"error":str(error)})
            return
        if route.path == "/api/preview":
            query = urllib.parse.parse_qs(route.query)
            slug = query.get("slug", [""])[0]
            slot = query.get("slot", ["1"])[0]
            if not re.fullmatch(r"[a-z0-9-]{2,80}", slug) or slot not in {"1", "2", "3"}:
                self._json(400, {"error": "invalid preview target"})
                return
            length = min(int(self.headers.get("Content-Length", "0")), 64 * 1024 * 1024)
            if not length:
                self._json(400, {"error": "empty capture"})
                return
            suffix = "" if slot == "1" else "-" + slot
            output = ROOT / "covers" / f"{slug}-gameplay{suffix}.gif"
            temp = tempfile.NamedTemporaryFile(prefix="nightglass-preview-", suffix=".webm", delete=False)
            try:
                remaining = length
                while remaining:
                    chunk = self.rfile.read(min(1024 * 1024, remaining))
                    if not chunk:
                        break
                    temp.write(chunk)
                    remaining -= len(chunk)
                temp.close()
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", temp.name, "-vf",
                    "fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer",
                    "-t", "6", str(output)], check=True, timeout=45)
                self._json(201, {"preview": str(output.relative_to(ROOT))})
            except (OSError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
                self._json(500, {"error": str(error)})
            finally:
                try:
                    Path(temp.name).unlink()
                except OSError:
                    pass
            return
        if route.path in {"/api/files/mkdir", "/api/files/rename", "/api/files/trash", "/api/files/upload", "/api/files/open"}:
            length = min(int(self.headers.get("Content-Length", "0")), 1024 ** 3)
            if route.path == "/api/files/upload":
                folder = safe_home_path(urllib.parse.parse_qs(route.query).get("path", ["Desktop"])[0])
                filename = Path(urllib.parse.unquote(self.headers.get("X-File-Name", "upload.bin"))).name
                target = (folder / filename) if folder and folder.is_dir() else None
                if not target or target.exists():
                    self._json(409, {"error": "file exists or folder is invalid"})
                    return
                with target.open("wb") as handle:
                    remaining = length
                    while remaining:
                        chunk = self.rfile.read(min(1024 * 1024, remaining))
                        if not chunk:
                            break
                        handle.write(chunk)
                        remaining -= len(chunk)
                self._json(201, {"created": str(target.relative_to(HOME_ROOT))})
                return
            try:
                payload = json.loads(self.rfile.read(length) or b"{}")
            except ValueError:
                self._json(400, {"error": "invalid request"})
                return
            source = safe_home_path(payload.get("path", ""))
            try:
                if route.path == "/api/files/mkdir":
                    folder = safe_home_path(payload.get("parent", "Desktop"))
                    name = Path(payload.get("name", "")).name
                    if not folder or not name:
                        raise ValueError("invalid folder")
                    target = folder / name
                    target.mkdir()
                elif route.path == "/api/files/rename":
                    name = Path(payload.get("name", "")).name
                    if not source or source == HOME_ROOT or not name:
                        raise ValueError("invalid rename")
                    target = source.with_name(name)
                    source.rename(target)
                elif route.path == "/api/files/trash":
                    if not source or source == HOME_ROOT:
                        raise ValueError("invalid trash target")
                    subprocess.run(["gio", "trash", str(source)], check=True)
                else:
                    if not source or not source.exists():
                        raise ValueError("file not found")
                    subprocess.Popen(["gio", "open", str(source)], start_new_session=True,
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                        env={**os.environ, "DISPLAY": os.environ.get("DISPLAY", ":0")})
                self._json(200, {"ok": True})
            except (OSError, ValueError, subprocess.CalledProcessError) as error:
                self._json(400, {"error": str(error)})
            return
        multiplayer_prefix = "/api/multiplayer/"
        action_prefix = "/api/launch/"
        app_prefix = "/api/app/"
        install_prefix = "/api/install/"
        uninstall_prefix = "/api/uninstall/"
        if self.path.startswith(uninstall_prefix):
            app_id = urllib.parse.unquote(self.path[len(uninstall_prefix):])
            scope = flatpak_scopes().get(app_id)
            command = (["flatpak", "--user", "uninstall", "-y", app_id] if scope == "user" else
                       ["sudo", "flatpak", "--system", "uninstall", "-y", app_id] if scope == "system" else None)
            name = app_id
        elif self.path.startswith(install_prefix):
            app_id = urllib.parse.unquote(self.path[len(install_prefix):])
            command = [str(ROOT / "scripts/setup/install-flatpak.sh"), app_id] if re.fullmatch(r"[A-Za-z0-9_.-]+", app_id) else None
            name = app_id
        elif self.path.startswith(app_prefix):
            app_id = self.path[len(app_prefix):]
            app = installed_apps().get(app_id)
            command = ["gio", "launch", app["path"]] if app else None
            name = app["name"] if app else ""
        elif self.path.startswith(multiplayer_prefix):
            name = self.path[len(multiplayer_prefix):]
            command = [str(LAUNCHER), name] if name in ALLOWED else None
        elif self.path.startswith(action_prefix):
            name = self.path[len(action_prefix):]
            command = ACTIONS.get(name)
        else:
            command = None
            name = ""
        if not command:
            self._json(400, {"error": "unsupported action"})
            return
        if self.path.startswith(install_prefix) or self.path.startswith(uninstall_prefix):
            job = start_job("install" if self.path.startswith(install_prefix) else "uninstall", app_id, command)
            self._json(202, job)
            return
        environment = os.environ.copy()
        environment.setdefault("DISPLAY", ":0")
        subprocess.Popen(
            command,
            cwd=str(ROOT),
            start_new_session=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            env=environment,
        )
        self._json(202, {"started": name})


if __name__ == "__main__":
    icon_index()
    ThreadingHTTPServer(("0.0.0.0", 8765), PocketArchiveHandler).serve_forever()
