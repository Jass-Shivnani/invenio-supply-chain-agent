#!/usr/bin/env python3
"""
Invenio AI (PS-08) — Zero-Dependency Full-Stack Launcher (`python main.py`).
1. Runs the 11-agent CLI verification & prints the full supply chain tables to the terminal.
2. Starts a local HTTP + REST API server on the first free port (8080..8099) using Python's
   built-in `http.server` and `sqlite3` (so ZERO pip packages are required to run it!).
3. Automatically opens the interactive Invenio AI Dashboard in your default web browser.
"""

import json
import os
import socket
import sys
import threading
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from database.schema_and_seed import init_and_seed_db, DEFAULT_DB_PATH
from agents.core_agents import SupplyChainOrchestrator
from cli import run_cli_demo

ROOT_DIR = Path(__file__).resolve().parent
STATIC_HTML = ROOT_DIR / "static" / "index.html"


class InvenioRequestHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def _send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ("/", "/index.html"):
            content = STATIC_HTML.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return
        if parsed.path == "/api/state":
            orch = SupplyChainOrchestrator(DEFAULT_DB_PATH)
            self._send_json(orch.run_autonomous_loop())
            return
        if parsed.path == "/api/health":
            self._send_json({"status": "ok", "system": "Invenio AI PS-08", "agents": 11})
            return
        self._send_json({"error": "Not found"}, status=404)

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        data = json.loads(raw or "{}")
        if parsed.path == "/api/simulate":
            orch = SupplyChainOrchestrator(DEFAULT_DB_PATH)
            res = orch.run_autonomous_loop(
                service_level_z=float(data.get("service_level_z", 1.645)),
                simulated_delays=data.get("simulated_delays"),
                seasonal_override=data.get("seasonal_override"),
                gemini_api_key=data.get("gemini_api_key"),
                persist_pos=False,
            )
            self._send_json(res)
            return
        if parsed.path == "/api/reset":
            init_and_seed_db(DEFAULT_DB_PATH, force_reset=True)
            orch = SupplyChainOrchestrator(DEFAULT_DB_PATH)
            self._send_json(orch.run_autonomous_loop())
            return
        self._send_json({"error": "Unknown endpoint"}, status=404)


def find_free_port(start_port: int = 8080, max_port: int = 8099) -> int:
    for port in range(start_port, max_port + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return 0


def start_server():
    run_cli_demo()
    port = find_free_port(8080, 8099)
    server = HTTPServer(("127.0.0.1", port), InvenioRequestHandler)
    actual_port = server.server_port
    url = f"http://127.0.0.1:{actual_port}"
    print("\n" + "=" * 112)
    print(f"[LIVE WEB DASHBOARD & API SERVER RUNNING AT]: {url}")
    print("  - Interactive Web Dashboard : " + url)
    print("  - Live JSON State Endpoint  : " + url + "/api/state")
    print("  - Press Ctrl+C in this terminal to stop the server.")
    print("=" * 112 + "\n")
    threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down Invenio AI server.")
        server.server_close()


if __name__ == "__main__":
    start_server()
