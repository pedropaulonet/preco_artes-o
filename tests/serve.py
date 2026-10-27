"""Serve browser tests; --run executes them in an isolated Firefox profile."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import argparse
import json
import os
import subprocess
import tempfile
import threading

ROOT = Path(__file__).resolve().parent.parent
RESULT = {}
DONE = threading.Event()

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *_args):
        pass

    def do_POST(self):
        if self.path != '/__test_results':
            self.send_error(404)
            return
        size = int(self.headers.get('Content-Length', '0'))
        if not 0 < size < 1_000_000:
            self.send_error(400)
            return
        RESULT.update(json.loads(self.rfile.read(size)))
        self.send_response(200)
        self.end_headers()
        DONE.set()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--run', action='store_true')
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', 0 if args.run else args.port), Handler)
    url = f'http://localhost:{server.server_port}/tests/'
    print(url, flush=True)
    if not args.run:
        server.serve_forever()
    else:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        with tempfile.TemporaryDirectory(prefix='artesao-tests-') as profile:
            log = tempfile.TemporaryFile(mode='w+')
            browser = subprocess.Popen(['firefox', '--headless', '--no-remote', '--profile', profile, url], stdout=log, stderr=log)
            try:
                if not DONE.wait(50):
                    log.seek(0)
                    print(log.read()[-3000:])
                    raise SystemExit('Browser tests timed out')
                print(json.dumps(RESULT, ensure_ascii=False, indent=2))
            finally:
                browser.terminate()
                try:
                    browser.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    browser.kill()
                    browser.wait()
                server.shutdown()
            raise SystemExit(1 if RESULT.get('failed', 1) else 0)
