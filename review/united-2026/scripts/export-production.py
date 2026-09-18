#!/usr/bin/env python3
"""Export an isolated United site for production or preview; never deploy it."""
from pathlib import Path
from urllib.parse import unquote, urlsplit
from hashlib import sha256
import argparse
import json
import os
import re
import shutil
import tempfile
import xml.etree.ElementTree as ET

from lxml import html


PACKAGE = Path(__file__).resolve().parents[1]
FORMAT = 'united-static-export-v1'
MARKER = '.united-export.json'
EXCLUDED_PARTS = {'.git', '.openai', '__pycache__', 'node_modules', 'coverage',
                  'debug', 'comparar-contato'}
EXCLUDED_SUFFIXES = {'.map', '.log', '.tmp', '.pyc', '.php', '.phtml', '.phar'}
COMMERCIAL_ROUTES = ('index.html', 'cursos/index.html', 'quem-somos/index.html',
                     'faq/index.html')
CSS_URL = re.compile(r'''url\(\s*["']?([^\s)'";]+)["']?\s*\)''', re.I)
CSS_IMPORT = re.compile(r'''@import\s+["']([^"']+)["']''', re.I)
ROBOTS_NAMES = {'robots', 'googlebot', 'googlebot-news', 'googlebot-image', 'bingbot'}


class ExportError(ValueError):
    """An unsafe or incomplete export, leaving the previous output intact."""


def is_within(path, root):
    return path == root or root in path.parents


def repository_root(package):
    for candidate in (package, *package.parents):
        if (candidate / '.git').exists():
            return candidate
    return package


def reject_symlink_chain(path):
    for candidate in (path, *path.parents):
        if candidate.is_symlink():
            raise ExportError(f'Caminho com link simbólico não é aceito: {candidate}')


def validate_output(output, package, force):
    requested = Path(os.path.abspath(output.expanduser()))
    reject_symlink_chain(requested)
    output = requested.resolve()
    repo = repository_root(package.resolve())
    if is_within(output, repo) or is_within(repo, output):
        raise ExportError('A saída deve ficar fora do repositório e de seus diretórios pais.')
    if output == Path.home().resolve():
        raise ExportError('A pasta pessoal não pode ser usada como saída.')
    if output.exists():
        if not force:
            raise ExportError('A saída já existe. Use outra pasta ou --force em uma exportação anterior.')
        if not output.is_dir():
            raise ExportError('--force não pode substituir um arquivo.')
        try:
            marker = json.loads((output / MARKER).read_text(encoding='utf-8'))
        except (OSError, ValueError) as exc:
            raise ExportError('--force só substitui uma exportação gerada por este script.') from exc
        if marker.get('format') != FORMAT or marker.get('source_package') != str(package.resolve()):
            raise ExportError('A saída não pertence a uma exportação deste pacote.')
        allowed = {'site', 'publication', MARKER}
        if any(item.name not in allowed or item.is_symlink() for item in output.iterdir()):
            raise ExportError('A saída contém arquivos alheios à exportação; escolha outra pasta.')
        try:
            known_files = {item['path'] for item in marker['files']} | {MARKER}
        except (KeyError, TypeError) as exc:
            raise ExportError('O registro da exportação anterior está inválido.') from exc
        if any(item.is_symlink() or (item.is_file() and item.relative_to(output).as_posix()
                                    not in known_files) for item in output.rglob('*')):
            raise ExportError('A saída contém arquivos novos ou links; --force foi recusado.')
    return output


def excluded(relative):
    return (any(part.startswith('.') or part in EXCLUDED_PARTS for part in relative.parts)
            or relative.suffix.lower() in EXCLUDED_SUFFIXES
            or relative.name.endswith('~'))


def copy_dist(source, target):
    for path in sorted(source.rglob('*')):
        relative = path.relative_to(source)
        if excluded(relative):
            continue
        if path.is_symlink():
            raise ExportError(f'Link simbólico em dist: {relative}')
        if path.is_file():
            destination = target / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(path, destination)


def robots_meta(document):
    return [element for element in document.xpath('//meta')
            if element.get('name', '').lower() in ROBOTS_NAMES
            or element.get('http-equiv', '').lower() == 'x-robots-tag']


def blocked_directives(document):
    blocked = []
    for element in robots_meta(document):
        directives = re.split(r'[\s,;]+', element.get('content', '').lower())
        if {'noindex', 'nofollow', 'none'}.intersection(directives):
            blocked.append(element.get('content', ''))
    return blocked


def transform_html(site, mode):
    documents = {}
    for file in sorted(site.rglob('*.html')):
        relative = file.relative_to(site)
        document = html.document_fromstring(file.read_bytes())
        if mode == 'production':
            blocked = blocked_directives(document)
            if blocked:
                raise ExportError(f'{relative}: bloqueio de indexação na origem: {blocked}. '
                                  'Corrija a fonte de produção antes de exportar.')
            for element in document.xpath(
                    '//*[contains(concat(" ", normalize-space(@class), " "), " preview-mark ")'
                    ' or @data-preview-only]'):
                element.drop_tree()
        else:
            for element in robots_meta(document):
                element.drop_tree()
            heads = document.xpath('//head')
            if not heads:
                raise ExportError(f'{relative}: head ausente.')
            heads[0].append(html.Element('meta', name='robots', content='noindex,nofollow'))
        file.write_text(html.tostring(document, encoding='unicode', method='html',
                                      doctype='<!DOCTYPE html>') + '\n', encoding='utf-8')
        documents[relative.as_posix()] = document
    for route in COMMERCIAL_ROUTES:
        if route not in documents:
            raise ExportError(f'Página comercial ausente: {route}')
    return documents


def local_target(value, current, site):
    value = value.strip()
    if not value or value.startswith('#'):
        return None
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc:
        if parsed.scheme == 'file':
            raise ExportError(f'{current.relative_to(site)}: URL file:// não publicável.')
        return None
    decoded = unquote(parsed.path)
    if not decoded:
        return None
    if '\\' in decoded or '\x00' in decoded:
        raise ExportError(f'{current.relative_to(site)}: caminho local inválido: {value}')
    candidate = (site / decoded.lstrip('/') if decoded.startswith('/')
                 else current.parent / decoded).resolve()
    if not is_within(candidate, site.resolve()):
        raise ExportError(f'{current.relative_to(site)}: URL sai da raiz exportada: {value}')
    if candidate.is_dir():
        candidate /= 'index.html'
    if not candidate.is_file():
        raise ExportError(f'{current.relative_to(site)}: destino local ausente: {value}')
    return candidate


def check_links(site, documents):
    """Check HTML resources/navigation and CSS dependencies, including nested routes."""
    checked = set()

    def check(value, current):
        target = local_target(value, current, site)
        if target:
            checked.add(target.relative_to(site).as_posix())

    for relative, document in documents.items():
        current = site / relative
        if document.xpath('//base[@href]'):
            raise ExportError(f'{relative}: base href não permitido; use URLs relativas explícitas.')
        for element in document.iter():
            if not isinstance(element.tag, str):
                continue
            for attribute in ('src', 'href', 'poster', 'xlink:href'):
                value = element.get(attribute)
                if value:
                    check(value, current)
            for candidate in element.get('srcset', '').split(','):
                # Existing data URI fallbacks use src, while srcsets contain local images.
                if candidate.strip():
                    check(candidate.strip().split()[0], current)
            for value in CSS_URL.findall(element.get('style', '')):
                check(value, current)
        for style in document.xpath('//style'):
            for value in CSS_URL.findall(style.text or '') + CSS_IMPORT.findall(style.text or ''):
                check(value, current)
    for css in site.rglob('*.css'):
        text = css.read_text(encoding='utf-8')
        for value in CSS_URL.findall(text) + CSS_IMPORT.findall(text):
            check(value, css)
    return len(checked)


def configure_seo(package, site, mode):
    if mode == 'preview':
        (site / 'robots.txt').write_text('User-agent: *\nDisallow: /\n', encoding='utf-8')
        for file in site.glob('sitemap*.xml'):
            file.unlink()
        return
    source = package / 'seo' / 'production'
    required = [source / 'robots.txt', source / 'sitemap.xml']
    if any(not file.is_file() or file.is_symlink() for file in required):
        raise ExportError('seo/production precisa conter robots.txt e sitemap.xml regulares.')
    robots = required[0].read_text(encoding='utf-8')
    if re.search(r'^\s*Disallow\s*:\s*/(?:\*\$?|\$)?\s*(?:#.*)?$', robots, re.I | re.M):
        raise ExportError('robots.txt de produção bloqueia a raiz.')
    if 'Sitemap: https://www.unitedidiomas.com/sitemap.xml' not in robots:
        raise ExportError('robots.txt de produção precisa informar o sitemap oficial.')
    if 'Sitemap: https://unitedidiomas.com/blog/sitemap_index.xml' not in robots:
        raise ExportError('robots.txt de produção precisa preservar o sitemap do blog WordPress.')
    shutil.copyfile(required[0], site / 'robots.txt')
    for file in source.glob('sitemap*.xml'):
        if file.is_symlink():
            raise ExportError(f'Sitemap com link simbólico: {file.name}')
        try:
            tree = ET.fromstring(file.read_bytes())
        except ET.ParseError as exc:
            raise ExportError(f'Sitemap XML inválido: {file.name}') from exc
        if tree.tag.rsplit('}', 1)[-1] not in {'urlset', 'sitemapindex'}:
            raise ExportError(f'Raiz XML inesperada em {file.name}')
        locations = [node.text or '' for node in tree.iter()
                     if node.tag.rsplit('}', 1)[-1] == 'loc']
        if not locations:
            raise ExportError(f'Sitemap sem URLs: {file.name}')
        for location in locations:
            parsed = urlsplit(location)
            if (parsed.scheme != 'https' or parsed.netloc != 'www.unitedidiomas.com'
                    or any(part in parsed.path.split('/') for part in ('review', 'comparar-contato'))):
                raise ExportError(f'URL imprópria em {file.name}: {location}')
        shutil.copyfile(file, site / file.name)


def export_site(package, output, mode, force=False):
    if mode not in {'production', 'preview'}:
        raise ExportError('Informe explicitamente production ou preview.')
    package = package.resolve()
    source = package / 'dist'
    if not source.is_dir() or source.is_symlink():
        raise ExportError('dist não existe ou é um link simbólico.')
    output = validate_output(Path(output), package, force)
    output.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=f'.{output.name}-staging-', dir=output.parent))
    backup = None
    try:
        site = staging / 'site'
        site.mkdir()
        copy_dist(source, site)
        documents = transform_html(site, mode)
        configure_seo(package, site, mode)
        dependencies = check_links(site, documents)
        publication = staging / 'publication'
        publication.mkdir()
        instructions = package / 'seo' / 'production' / 'INSTRUCOES-PUBLICACAO.md'
        if instructions.is_file():
            shutil.copyfile(instructions, publication / instructions.name)
        if mode == 'production':
            apache = package / 'seo' / 'production' / 'apache-seo.conf'
            if apache.is_file():
                if apache.is_symlink():
                    raise ExportError('O fragmento Apache não pode ser um link simbólico.')
                shutil.copyfile(apache, publication / apache.name)
        report = {'format': FORMAT, 'source_package': str(package), 'mode': mode,
                  'pages': sorted(documents), 'local_dependencies_checked': dependencies,
                  'files': [{'path': file.relative_to(staging).as_posix(),
                             'sha256': sha256(file.read_bytes()).hexdigest()}
                            for file in sorted(staging.rglob('*')) if file.is_file()]}
        (staging / MARKER).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n',
                                    encoding='utf-8')
        # Validate again immediately before replacement; never delete an arbitrary directory.
        validate_output(output, package, force)
        if output.exists():
            backup = Path(tempfile.mkdtemp(prefix=f'.{output.name}-previous-', dir=output.parent))
            backup.rmdir()
            output.rename(backup)
        try:
            staging.rename(output)
        except OSError:
            if backup:
                backup.rename(output)
                backup = None
            raise
        if backup:
            shutil.rmtree(backup)
        return {'output': str(output), 'site': str(output / 'site'), 'mode': mode,
                'pages': len(documents), 'files': len(report['files']),
                'local_dependencies_checked': dependencies}
    finally:
        if staging.exists():
            shutil.rmtree(staging)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode', required=True, choices=('production', 'preview'))
    parser.add_argument('--output', required=True, type=Path,
                        help='Pasta fora do repositório. O conteúdo publicável ficará em site/.')
    parser.add_argument('--force', action='store_true',
                        help='Substitui somente uma exportação anterior deste mesmo pacote.')
    args = parser.parse_args()
    try:
        print(json.dumps(export_site(PACKAGE, args.output, args.mode, args.force), ensure_ascii=False))
    except (ExportError, OSError) as exc:
        parser.exit(1, f'Exportação recusada: {exc}\n')


if __name__ == '__main__':
    main()
