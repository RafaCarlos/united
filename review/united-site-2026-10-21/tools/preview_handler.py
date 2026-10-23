"""Local Live Class preview with byte-range support for native video players."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re


class PreviewHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        self.range_remaining = None
        path = Path(self.translate_path(self.path))
        if path.suffix.lower() != '.mp4' or not path.is_file():
            return super().send_head()
        stream = path.open('rb')
        size = path.stat().st_size
        start, end = 0, size - 1
        requested = self.headers.get('Range')
        if requested:
            match = re.fullmatch(r'bytes=(\d*)-(\d*)', requested.strip())
            valid = match and any(match.groups())
            if valid:
                first, last = match.groups()
                if first:
                    start = int(first)
                    end = min(int(last), end) if last else end
                else:
                    start = max(size - int(last), 0)
                    valid = int(last) > 0
                valid = valid and start <= end and start < size
            if not valid:
                stream.close()
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{size}')
                self.send_header('Content-Length', '0')
                self.end_headers()
                return None
        self.send_response(206 if requested else 200)
        self.send_header('Content-Type', 'video/mp4')
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(end - start + 1))
        self.send_header('Last-Modified', self.date_time_string(path.stat().st_mtime))
        if requested:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.end_headers()
        stream.seek(start)
        self.range_remaining = end - start + 1
        return stream

    def copyfile(self, source, outputfile):
        try:
            if self.range_remaining is None:
                return super().copyfile(source, outputfile)
            while self.range_remaining:
                chunk = source.read(min(65536, self.range_remaining))
                if not chunk:
                    break
                outputfile.write(chunk)
                self.range_remaining -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass  # The user may close or seek the video during a response.


if __name__ == '__main__':
    root = Path(__file__).resolve().parent / 'live-class-2026-10-09'
    server = ThreadingHTTPServer(('127.0.0.1', 8788), partial(PreviewHandler, directory=str(root)))
    print('Live Class: http://127.0.0.1:8788/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
