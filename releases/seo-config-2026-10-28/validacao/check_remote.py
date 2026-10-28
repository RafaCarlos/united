#!/usr/bin/env python3
"""Checagem pos-publicacao, somente GET/HEAD, sem executar JS ou enviar leads.

Sem --run apenas exibe o plano. Nao instala arquivos nem submete sitemaps.
"""
import argparse
from datetime import datetime, timezone
from html.parser import HTMLParser
import http.client
import json
from pathlib import Path
import re
import ssl
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

WWW = 'https://www.unitedidiomas.com'
BLOG = 'https://unitedidiomas.com'
ALLOWED_HOSTS = {'www.unitedidiomas.com', 'unitedidiomas.com'}
NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
LEGACY = ('/cursos-de-ingles-unitedidiomas', '/o-melhor-curso-de-ingles', '/cursos/curso-de-ingles-online')
PAGES = ('/', '/cursos/live-class/', '/cursos/business/', '/cursos/full/', '/quem-somos/', '/faq/')
QUERY = '?utm_source=seo_validation&next=a%2Fb%3Fc%3Dd&token=x%23y'
MAX_BYTES = 2 * 1024 * 1024


class PageMetadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical = []
        self.noindex = False
        self.comparator = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and 'canonical' in attrs.get('rel', '').lower().split():
            self.canonical.append(attrs.get('href'))
        if tag == 'meta' and attrs.get('name', '').lower() in ('robots', 'googlebot'):
            self.noindex |= 'noindex' in attrs.get('content', '').lower()
        self.comparator |= attrs.get('id') == 'comparar-cursos'


def plan():
    result = []
    for origin in (WWW, BLOG):
        for path in LEGACY:
            for slash in ('', '/'):
                for query in ('', QUERY):
                    result.append({'method': 'HEAD', 'url': origin + path + slash + query, 'kind': 'redirect', 'expected': WWW + '/cursos/live-class/' + query})
        for path in ('/cursos', '/cursos/'):
            for query in ('', QUERY):
                result.append({'method': 'HEAD', 'url': origin + path + query, 'kind': 'redirect', 'expected': WWW + '/' + query + '#comparar-cursos'})
    result.extend({'method': 'GET', 'url': WWW + path, 'kind': 'page'} for path in PAGES)
    result.extend([
        {'method': 'GET', 'url': WWW + '/robots.txt', 'kind': 'robots'},
        {'method': 'GET', 'url': WWW + '/sitemap.xml', 'kind': 'index'},
        {'method': 'GET', 'url': WWW + '/sitemap-united-pages.xml', 'kind': 'commercial'},
        {'method': 'GET', 'url': BLOG + '/blog/sitemap_index.xml', 'kind': 'wordpress'},
        {'method': 'HEAD', 'url': BLOG + '/blog/', 'kind': 'blog'},
        {'method': 'HEAD', 'url': WWW + '/site-navigation.js', 'kind': 'static'},
        {'method': 'HEAD', 'url': WWW + '/contact-form.css', 'kind': 'static'},
    ])
    return result


def fetch(item, timeout):
    url = urlsplit(item['url'])
    if item['method'] not in ('GET', 'HEAD') or url.scheme != 'https' or url.hostname not in ALLOWED_HOSTS or url.username or url.password or url.port not in (None, 443):
        raise ValueError('Requisicao fora dos metodos/hosts HTTPS permitidos.')
    connection = http.client.HTTPSConnection(url.hostname, timeout=timeout, context=ssl.create_default_context())
    try:
        target = (url.path or '/') + ('?' + url.query if url.query else '')
        connection.request(item['method'], target, headers={'User-Agent': 'United-SEO-Validation/1.0 (read-only)', 'Accept-Encoding': 'identity'})
        response = connection.getresponse()
        # Nao seguir redirects automaticamente: um salto inesperado e uma falha.
        body = response.read(MAX_BYTES + 1)
        if len(body) > MAX_BYTES:
            raise ValueError('Resposta maior que 2 MiB; leitura interrompida.')
        return response.status, {key.lower(): value for key, value in response.getheaders()}, body
    finally:
        connection.close()


def evaluate(item, status, headers, body):
    issues = []
    kind = item['kind']
    if kind == 'redirect':
        if status != 301 or headers.get('location') != item['expected']:
            issues.append('Esperado um unico 301 para ' + item['expected'])
        return issues
    if status != 200 or 'location' in headers:
        return [f'Esperado 200 direto; recebido {status} com Location={headers.get("location")}']
    if 'noindex' in headers.get('x-robots-tag', '').lower() and kind in ('page', 'blog'):
        issues.append('X-Robots-Tag noindex em pagina publica.')
    if kind == 'page':
        metadata = PageMetadata()
        metadata.feed(body.decode('utf-8', errors='replace'))
        if metadata.canonical != [item['url']]:
            issues.append('Canonical divergente ou duplicada: ' + repr(metadata.canonical))
        if metadata.noindex:
            issues.append('Meta robots/googlebot noindex em pagina publica.')
        if item['url'] == WWW + '/' and not metadata.comparator:
            issues.append('Ancora comparar-cursos ausente da Home.')
    elif kind == 'robots':
        if not headers.get('content-type', '').lower().startswith('text/plain'):
            issues.append('robots.txt deve responder como text/plain.')
        lines = [line.strip() for line in body.decode('utf-8-sig').splitlines() if line.strip() and not line.startswith('#')]
        required = ('User-agent: *', 'Allow: /', 'Disallow: /painel', 'Disallow: /blog/wp-admin/', 'Allow: /blog/wp-admin/admin-ajax.php', f'Sitemap: {WWW}/sitemap-united-pages.xml', f'Sitemap: {BLOG}/blog/sitemap_index.xml')
        for line in required:
            if line not in lines:
                issues.append('Diretiva prevista ausente: ' + line)
        # Grupos AI existentes podem ter Disallow: /: revisar por grupo, sem remove-los.
        wildcard = False
        for line in lines:
            if line.lower().startswith('user-agent:'):
                wildcard = line.split(':', 1)[1].strip() == '*'
            elif wildcard and line.lower() == 'disallow: /':
                issues.append('Grupo geral bloqueia todo o conteudo publico.')
    elif kind in ('index', 'commercial', 'wordpress'):
        if not any(value in headers.get('content-type', '').lower() for value in ('application/xml', 'text/xml')):
            issues.append('Sitemap precisa de Content-Type XML.')
        root = ET.fromstring(body)
        if kind == 'commercial':
            entries = [node.text for node in root.findall(f'{NS}url/{NS}loc')]
            if root.tag != NS + 'urlset' or len(entries) != 6 or set(entries) != {WWW + path for path in PAGES}:
                issues.append('Sitemap comercial deve conter exatamente as seis URLs aprovadas, sem paginacao do blog.')
        else:
            entries = [node.text for node in root.findall(f'{NS}sitemap/{NS}loc')]
            if root.tag != NS + 'sitemapindex' or not entries:
                issues.append('Indice XML invalido ou vazio.')
            if kind == 'index' and entries != [WWW + '/sitemap-united-pages.xml']:
                issues.append('Indice raiz deve apontar apenas ao sitemap comercial; WP fica separado no robots.')
    elif kind == 'static':
        cache = headers.get('cache-control', '').lower()
        age = re.search(r'(?:^|,)\s*max-age=(\d+)', cache)
        if not any(token in cache for token in ('private', 'no-store')) and (not age or not 0 <= int(age.group(1)) <= 86400):
            issues.append('CSS/JS sem politica conservadora de ate 1 dia; verificar modulo/conflitos de cache.')
        if 'immutable' in cache:
            issues.append('immutable inesperado para nome estavel.')
    return issues


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', action='store_true', help='Executar as requisicoes HTTPS publicas do plano.')
    parser.add_argument('--timeout', type=float, default=15, help='Timeout por requisicao (segundos).')
    parser.add_argument('--report', type=Path, help='Salvar resultado JSON no caminho indicado.')
    args = parser.parse_args()
    targets = plan()
    report = {'mode': 'run' if args.run else 'plan', 'generated_at_utc': datetime.now(timezone.utc).isoformat(), 'requests': len(targets), 'read_only': True, 'results': []}
    if not args.run:
        report['results'] = targets
    else:
        for item in targets:
            entry = dict(item)
            try:
                status, headers, body = fetch(item, args.timeout)
                issues = evaluate(item, status, headers, body)
                entry.update(status=status, headers={key: headers[key] for key in ('location', 'content-type', 'cache-control', 'x-robots-tag', 'content-encoding', 'vary') if key in headers}, ok=not issues, issues=issues)
            except Exception as exc:
                entry.update(ok=False, issues=[f'{type(exc).__name__}: {exc}'])
            report['results'].append(entry)
        report['passed'] = sum(entry['ok'] for entry in report['results'])
        report['failed'] = len(targets) - report['passed']
    output = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(output)
    print(output)
    return 1 if report.get('failed') else 0


if __name__ == '__main__':
    raise SystemExit(main())
