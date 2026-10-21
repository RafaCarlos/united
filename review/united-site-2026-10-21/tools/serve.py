"""Review generated files locally without exposing source or directory listings."""
import argparse
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
from preview_handler import PreviewHandler

class Handler(PreviewHandler):
    def send_head(self):
        root = Path(self.directory).resolve()
        candidate = Path(self.translate_path(self.path)).resolve()
        try:
            relative = candidate.relative_to(root)
        except ValueError:
            self.send_error(404)
            return None
        if any(p.startswith('.') or p == 'evidence' for p in relative.parts):
            self.send_error(404)
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404)
        return None

    def end_headers(self):
        self.send_header('X-Robots-Tag', 'noindex, nofollow')
        super().end_headers()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', default='preview', choices=['preview', 'dist'])
    parser.add_argument('--port', type=int, default=8790)
    parser.add_argument('--bind', default='127.0.0.1')
    args = parser.parse_args()
    folder = Path(__file__).resolve().parents[1] / args.directory
    server = ThreadingHTTPServer((args.bind,args.port),partial(Handler,directory=str(folder)))
    print(f'United: http://{args.bind}:{args.port}/',flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
