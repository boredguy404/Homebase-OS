#!/usr/bin/env python3
"""Radio Orbit: dependency-free local server and Radio Browser proxy."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs, urlencode
from urllib.request import Request, urlopen
import json
import os

ROOT = Path(__file__).resolve().parent
API = "https://de1.api.radio-browser.info/json/stations/search"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/stations":
            query = parse_qs(parsed.query).get("q", [""])[0].strip()[:80]
            params = {
                "limit": 60, "hidebroken": "true", "order": "clickcount",
                "reverse": "true", "name": query,
            }
            req = Request(f"{API}?{urlencode(params)}", headers={
                "User-Agent": "RadioOrbit/1.0",
                "Accept": "application/json",
            })
            try:
                with urlopen(req, timeout=12) as response:
                    payload = response.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Cache-Control", "public, max-age=120")
                self.end_headers()
                self.wfile.write(payload)
            except Exception as exc:
                payload = json.dumps({"error": str(exc)}).encode()
                self.send_response(502)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(payload)
            return
        super().do_GET()

    def log_message(self, fmt, *args):
        print(f"[radio-orbit] {fmt % args}")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    print(f"Radio Orbit is live at http://localhost:{port}")
    print("Press Ctrl+C to stop.")
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
