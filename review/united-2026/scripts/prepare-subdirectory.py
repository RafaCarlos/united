"""Normalize preview URLs for hosting at the domain root or in a subdirectory."""
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
from hashlib import sha256
import argparse
import json
import posixpath
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'dist'
ATTR = re.compile(r'''(?P<prefix>\b(?:xlink:href|href|src|poster|srcset)\s*=\s*)(?P<quote>["'])(?P<value>.*?)(?P=quote)''', re.S)
CSS_URL = re.compile(r'''url\(\s*(?P<quote>["']?)(?P<value>[^\s)'";]+)(?P=quote)\s*\)''')


def relative_url(value, document):
    if not value.startswith('/') or value.startswith('//'):
        return value
    parsed = urlsplit(value)
    target = parsed.path.lstrip('/') or '.'
    target_file = SOURCE / target
    if target_file.is_dir():
        target_file /= 'index.html'
    if not target_file.is_file():
        raise ValueError(f'Unknown local target in {document}: {value}')
    if parsed.fragment and not parsed.query and target_file == SOURCE / document:
        return '#' + parsed.fragment
    path = posixpath.relpath(target, posixpath.dirname(document) or '.')
    if parsed.path.endswith('/'):
        path = './' if path == '.' else path.rstrip('/') + '/'
    return urlunsplit(('', '', path, parsed.query, parsed.fragment))


def css_urls(text, document):
    def replace(match):
        old = match.group('value')
        new = relative_url(old, document)
        return match.group(0).replace(old, new, 1)
    return CSS_URL.sub(replace, text)


def html_urls(text, document):
    def replace(match):
        value = match.group('value')
        if match.group('prefix').strip().startswith('srcset'):
            value = re.sub(r'(?<!\S)/(?!/)[^\s,]+', lambda m: relative_url(m.group(0), document), value)
        else:
            value = relative_url(value, document)
        return match.group('prefix') + match.group('quote') + value + match.group('quote')
    text = css_urls(ATTR.sub(replace, text), document)
    if document == 'comparar-contato/index.html':
        # The comparison controls generate iframe/link URLs after a scene change.
        text = text.replace("'/?cta='", "'../?cta='")
    return text


def refresh_manifests():
    for name in ['MANIFEST-SERVIDOR.json', 'MANIFEST.json']:
        path = ROOT / name
        manifest = json.loads(path.read_text())
        if name == 'MANIFEST-SERVIDOR.json':
            files = [p for p in SOURCE.rglob('*') if p.is_file()]
            files.append(ROOT / 'CORRECAO-SERVIDOR.md')
        else:
            files = [p for directory in ['dist', 'src', 'scripts', 'seo']
                     for p in (ROOT / directory).rglob('*') if p.is_file()
                     and '.openai' not in p.relative_to(ROOT).parts
                     and '__pycache__' not in p.parts]
            files += [ROOT / p for p in ['README.md', 'package.json',
                      'package-lock.json', 'vite.config.mjs', 'requirements-review.txt',
                      'CORRECAO-SERVIDOR.md', 'MANIFEST-SERVIDOR.json']]
        manifest['files'] = []
        for file in sorted(files):
            data = file.read_bytes()
            manifest['files'].append({'path': file.relative_to(ROOT).as_posix(),
                                      'bytes': len(data), 'sha256': sha256(data).hexdigest()})
        path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh-manifests', action='store_true',
                        help='Refresh both integrity manifests after the final audit.')
    args = parser.parse_args()
    for file in sorted(SOURCE.rglob('*.html')):
        before = file.read_text()
        after = html_urls(before, file.relative_to(SOURCE).as_posix())
        if after != before:
            file.write_text(after)
    renamed = {}
    for file in sorted(SOURCE.rglob('*.css')):
        before = file.read_text()
        after = css_urls(before, file.relative_to(SOURCE).as_posix())
        if after == before:
            continue
        file.write_text(after)
        if re.fullmatch(r'page-.+-[a-f0-9]{12}\.css', file.name):
            digest = sha256(file.read_bytes()).hexdigest()[:12]
            new_name = re.sub(r'[a-f0-9]{12}\.css$', digest + '.css', file.name)
            renamed[file.name] = new_name
            file.rename(file.with_name(new_name))
    if renamed:
        for file in sorted(SOURCE.rglob('*.html')):
            before = file.read_text()
            after = before
            for old, new in renamed.items():
                after = after.replace(old, new)
            if after != before:
                file.write_text(after)
    if args.refresh_manifests:
        refresh_manifests()
    print('Preview paths normalized; visual content and external URLs preserved.')


if __name__ == '__main__':
    main()
