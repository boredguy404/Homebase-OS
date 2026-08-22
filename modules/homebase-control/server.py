#!/usr/bin/env python3
import json, os, shutil, socket, time
from datetime import datetime
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

HOME = Path.home()
ROOT = Path(__file__).resolve().parent
APP_ROOT = ROOT.parents[1]
VAULT = APP_ROOT / 'saves' / 'Save-Vault'
TOKEN = 'nightglass-local-8264'
def save_files():
    roots = [APP_ROOT / 'saves', HOME / 'My Library']
    extensions = {'.sav', '.srm', '.state', '.ss0', '.ss1', '.ss2'}
    return [path for root in roots if root.exists() for path in root.rglob('*') if path.is_file() and path.suffix.lower() in extensions and VAULT not in path.parents]

def status():
    mem = {}
    for line in Path('/proc/meminfo').read_text().splitlines():
        key, value = line.split(':', 1)
        mem[key] = int(value.strip().split()[0]) * 1024
    disk = shutil.disk_usage(HOME)
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8', 80)); ip = s.getsockname()[0]; s.close()
    except OSError: ip = 'penguin.linux.test'
    return {'load': os.getloadavg()[0], 'memoryUsed': mem['MemTotal']-mem.get('MemAvailable',mem['MemFree']), 'memoryTotal': mem['MemTotal'], 'diskUsed': disk.used, 'diskTotal': disk.total, 'uptime': float(Path('/proc/uptime').read_text().split()[0]), 'ip': ip}

def backup():
    stamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    target = VAULT / stamp; target.mkdir(parents=True, exist_ok=False)
    manifest = []
    for source in save_files():
        if source.exists():
            dest = target / source.name; shutil.copy2(source, dest)
            manifest.append({'source': str(source), 'file': dest.name, 'size': dest.stat().st_size})
    (target / 'manifest.json').write_text(json.dumps(manifest, indent=2))
    return {'name': stamp, 'files': len(manifest)}

def backups():
    VAULT.mkdir(parents=True, exist_ok=True)
    result=[]
    for folder in sorted((p for p in VAULT.iterdir() if p.is_dir()), reverse=True):
        try: manifest=json.loads((folder/'manifest.json').read_text())
        except Exception: continue
        result.append({'name':folder.name,'files':len(manifest),'size':sum(x['size'] for x in manifest)})
    return result

def restore(name):
    folder = (VAULT / name).resolve()
    if folder.parent != VAULT.resolve() or not folder.is_dir(): raise ValueError('invalid backup')
    manifest=json.loads((folder/'manifest.json').read_text())
    for item in manifest:
        source=Path(item['source']); source.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(folder/item['file'],source)
    return {'name':name,'files':len(manifest)}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw): super().__init__(*a,directory=str(ROOT/'web'),**kw)
    def log_message(self,fmt,*args): pass
    def send_json(self,data,code=200):
        raw=json.dumps(data).encode(); self.send_response(code); self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(raw))); self.end_headers(); self.wfile.write(raw)
    def do_GET(self):
        path=urlparse(self.path).path
        if path=='/api/status': return self.send_json(status())
        if path=='/api/backups': return self.send_json(backups())
        return super().do_GET()
    def do_POST(self):
        if self.headers.get('X-Nightglass-Token') != TOKEN: return self.send_json({'error':'denied'},403)
        try:
            length=int(self.headers.get('Content-Length','0')); body=json.loads(self.rfile.read(length) or b'{}')
            path=urlparse(self.path).path
            if path=='/api/backup': return self.send_json(backup())
            if path=='/api/restore': return self.send_json(restore(body.get('name','')))
            self.send_json({'error':'not found'},404)
        except Exception as e: self.send_json({'error':str(e)},400)

if __name__=='__main__':
    VAULT.mkdir(parents=True,exist_ok=True)
    ThreadingHTTPServer(('0.0.0.0',8780),Handler).serve_forever()
