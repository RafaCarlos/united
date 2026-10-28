#!/usr/bin/env python3
"""Validacao sem internet: XML, robots e Apache real isolado em loopback."""
import argparse
import gzip
import grp
import hashlib
import http.client
import json
import os
from pathlib import Path
import pwd
import re
import runpy
import shutil
import socket
import subprocess
import tempfile
import time
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
ORIGIN = 'https://www.unitedidiomas.com'
COURSES = ('/cursos/live-class/', '/cursos/business/', '/cursos/full/')
LEGACY = ('/cursos-de-ingles-unitedidiomas', '/o-melhor-curso-de-ingles', '/cursos/curso-de-ingles-online')
checks = []


def check(name, condition, detail=None):
    checks.append({'check': name, 'ok': bool(condition), **({'detail': detail} if not condition else {})})


def package_checks():
    commercial = ET.parse(ROOT / 'publicar/sitemap-united-pages.xml').getroot()
    urls = [node.text for node in commercial.findall(f'{NS}url/{NS}loc')]
    expected = {ORIGIN + p for p in (*COURSES, '/quem-somos/', '/', '/faq/')}
    check('sitemap comercial: exatamente seis URLs canonicas', commercial.tag == NS + 'urlset' and set(urls) == expected and len(urls) == 6, urls)
    # Hash da fonte aprovada permite validar tambem o pacote extraido sem o repo.
    source_sha256 = '51c0146ad29cd2ffd6c81c74917eb307c8ecbf48246eb3495f05b65de990e483'
    check('sitemap comercial: copia exata da fonte aprovada (SHA-256)', hashlib.sha256((ROOT / 'publicar/sitemap-united-pages.xml').read_bytes()).hexdigest() == source_sha256)
    index = ET.parse(ROOT / 'publicar/sitemap.xml').getroot()
    entries = [node.text for node in index.findall(f'{NS}sitemap/{NS}loc')]
    check('indice raiz sem indices aninhados ou hosts misturados', index.tag == NS + 'sitemapindex' and entries == [ORIGIN + '/sitemap-united-pages.xml'], entries)
    robots = (ROOT / 'publicar/robots.txt').read_text()
    lines = [line.strip() for line in robots.splitlines() if line.strip() and not line.startswith('#')]
    check('robots anuncia comercial e WordPress independente', [v for v in lines if v.startswith('Sitemap:')] == [f'Sitemap: {ORIGIN}/sitemap-united-pages.xml', 'Sitemap: https://unitedidiomas.com/blog/sitemap_index.xml'])
    check('robots libera conteudo publico e recursos', 'User-agent: *' in lines and 'Allow: /' in lines and 'Disallow: /' not in lines)
    check('robots protege rastreamento administrativo e permite admin-ajax', all(v in lines for v in ('Disallow: /painel', 'Disallow: /blog/wp-admin/', 'Allow: /blog/wp-admin/admin-ajax.php')))
    check('robots nao inventa grupos de IA', [v for v in lines if v.startswith('User-agent:')] == ['User-agent: *'])
    remote = runpy.run_path(str(ROOT / 'validacao/check_remote.py'))
    plan = remote['plan']()
    check('verificador remoto limita plano a GET/HEAD em HTTPS United', len(plan) == 45 and all(item['method'] in ('GET', 'HEAD') and item['url'].startswith(('https://www.unitedidiomas.com/', 'https://unitedidiomas.com/')) for item in plan))
    redirect = {'kind': 'redirect', 'expected': ORIGIN + '/?utm_source=teste#comparar-cursos'}
    check('verificador remoto detecta query dentro da ancora', bool(remote['evaluate'](redirect, 301, {'location': ORIGIN + '/#comparar-cursos?utm_source=teste'}, b'')))
    check('verificador remoto aceita query antes da ancora', remote['evaluate'](redirect, 301, {'location': redirect['expected']}, b'') == [])
    page = {'kind': 'page', 'url': ORIGIN + '/'}
    check('verificador remoto detecta pagina 200 com noindex', bool(remote['evaluate'](page, 200, {}, b'<link rel="canonical" href="https://www.unitedidiomas.com/"><meta name="robots" content="noindex"><section id="comparar-cursos">')))
    bad_index = f'<sitemapindex xmlns="{NS[1:-1]}"><sitemap><loc>https://unitedidiomas.com/blog/sitemap_index.xml</loc></sitemap></sitemapindex>'.encode()
    check('verificador remoto rejeita indice WP aninhado', bool(remote['evaluate']({'kind': 'index'}, 200, {'content-type': 'application/xml'}, bad_index)))


def apache_checks():
    apache = shutil.which('httpd') or shutil.which('apache2')
    if not apache:
        raise RuntimeError('Apache nao encontrado: instale/use Apache 2.4 para a validacao real.')
    module_dir = next((p for p in (Path('/usr/libexec/apache2'), Path('/usr/lib/apache2/modules'), Path('/usr/lib64/httpd/modules')) if (p / 'mod_rewrite.so').exists()), None)
    if not module_dir:
        raise RuntimeError('Diretorio de modulos Apache nao identificado neste sistema.')
    version = subprocess.check_output([apache, '-v'], text=True).strip().splitlines()[0]
    compiled = subprocess.check_output([apache, '-l'], text=True)
    with tempfile.TemporaryDirectory(prefix='united-seo-apache-') as tmp:
        base = Path(tmp)
        docroot = base / 'public'
        docroot.mkdir()
        fixtures = {
            'index.html': '<h1>Home</h1><section id="comparar-cursos">4 cursos</section>' * 80,
            'quem-somos/index.html': 'Quem somos', 'faq/index.html': 'FAQ',
            'blog/index.html': 'Blog independente ' * 200,
            'painel/index.html': 'Painel protegido',
            'assets/css/test.css': 'body { color: #123456; }\n' * 200,
            'assets/js/test.js': 'console.log("static");\n' * 200,
            'home/home-local.css': 'body{margin:0}',
            'site-navigation.js': 'console.log("menu");',
            'assets/css/private.css': 'body{}',
            'assets/css/no-store.css': 'body{}',
            'assets/css/cookie.css': 'body{}',
            'assets/css/established.css': 'body{}',
            'assets/css/not-css.css': '<html>dynamic response</html>',
            'assets/fonts/test.woff2': 'font fixture',
            'assets/images/test.svg': '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
            'assets/images/test.webp': 'webp fixture',
            'rdstation-account.js': 'console.log("rd");' * 200,
            'home/rdstation-form.js': 'console.log("rd");' * 200,
            'assets/js/rdstation-form.js': 'console.log("rd");' * 200,
            'form.php': '<html>PHP endpoint fixture</html>' * 200,
            'blog/assets/test.css': 'body{}' * 200,
        }
        for course in COURSES:
            fixtures[course.strip('/') + '/index.html'] = 'Curso canonico'
        for relative, body in fixtures.items():
            file = docroot / relative
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_text(body)
        (docroot / 'blog/.htaccess').write_text('RewriteEngine On\nRewriteRule ^post-example$ index.html [L]\n')
        redirects = (ROOT / 'apache/01-redirecionamentos-raiz.conf').read_text()
        assets = (ROOT / 'apache/02-cache-compressao-raiz.conf').read_text()
        # Modela seguranca anterior, headers existentes e regras legadas posteriores.
        existing_headers = '''
<Files "private.css">
 Header always set Cache-Control "private, max-age=0"
</Files>
<Files "no-store.css">
 Header set Cache-Control "no-store"
</Files>
<Files "cookie.css">
 Header always set Set-Cookie "session=fixture; HttpOnly"
</Files>
<Files "established.css">
 Header set Cache-Control "public, max-age=600"
</Files>
<Files "not-css.css">
 ForceType text/html
</Files>
'''
        security = 'RewriteEngine On\nRewriteRule ^guarded$ - [F,L]\n'
        legacy = '\nRewriteRule ^(?:cursos-de-ingles-unitedidiomas|o-melhor-curso-de-ingles|cursos/curso-de-ingles-online)/?$ /cursos [R=301,L]\nRewriteRule ^cursos$ /cursos/ [R=301,L]\n'
        (docroot / '.htaccess').write_text(security + redirects + existing_headers + assets + legacy)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        modules = ('mpm_prefork', 'unixd', 'authz_core', 'dir', 'mime', 'rewrite', 'headers', 'filter', 'deflate')
        loads = '\n'.join(f'LoadModule {name}_module "{module_dir}/mod_{name}.so"' for name in modules if f'mod_{name}.c' not in compiled)
        config = base / 'httpd.conf'
        config.write_text(f'''ServerRoot "{base}"
PidFile "{base}/httpd.pid"
Listen 127.0.0.1:{port}
ServerName www.unitedidiomas.com
{loads}
User {pwd.getpwuid(os.getuid()).pw_name}
Group {grp.getgrgid(os.getgid()).gr_name}
ErrorLog "{base}/error.log"
LogLevel warn
DocumentRoot "{docroot}"
TypesConfig /dev/null
AddType text/html .html .php
AddType text/css .css
AddType application/javascript .js
AddType image/svg+xml .svg
AddType image/webp .webp
AddType font/woff2 .woff2
DirectoryIndex index.html
<Directory "{docroot}">
 AllowOverride FileInfo
 Options FollowSymLinks
 Require all granted
</Directory>
<Directory "{docroot}/painel">
 Require all denied
</Directory>
''')
        syntax = subprocess.run([apache, '-t', '-f', str(config)], capture_output=True, text=True)
        check('Apache real: sintaxe da configuracao isolada', syntax.returncode == 0, syntax.stderr)
        if syntax.returncode:
            raise RuntimeError(syntax.stderr)
        process = subprocess.Popen([apache, '-f', str(config), '-DFOREGROUND'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True)

        def request(path, method='GET', host='www.unitedidiomas.com', headers=None):
            connection = http.client.HTTPConnection('127.0.0.1', port, timeout=5)
            try:
                connection.request(method, path, headers={'Host': host, **(headers or {})})
                response = connection.getresponse()
                return response.status, {k.lower(): v for k, v in response.getheaders()}, response.read()
            finally:
                connection.close()

        try:
            for attempt in range(60):
                if process.poll() is not None:
                    raise RuntimeError(process.communicate()[1].decode() + (base / 'error.log').read_text())
                try:
                    request('/')
                    break
                except OSError:
                    time.sleep(0.05)
            else:
                raise RuntimeError('Apache nao iniciou em loopback.')
            query = 'utm_source=teste&next=a%2Fb%3Fc%3Dd&valor=um+dois&token=x%23y'
            for source in LEGACY:
                for slash in ('', '/'):
                    for method in ('GET', 'HEAD'):
                        for host in ('www.unitedidiomas.com', 'unitedidiomas.com'):
                            for suffix in ('', '?' + query):
                                status, headers, _ = request(source + slash + suffix, method=method, host=host)
                                expected = ORIGIN + '/cursos/live-class/' + suffix
                                check(f'301 direto legado {method} {host}{source}{slash}{suffix}', status == 301 and headers.get('location') == expected, [status, headers.get('location')])
            for source in ('/cursos', '/cursos/'):
                for suffix in ('', '?' + query):
                    for method in ('GET', 'HEAD'):
                        status, headers, _ = request(source + suffix, method=method)
                        expected = ORIGIN + '/' + suffix + '#comparar-cursos'
                        check(f'catalogo direto com ancora {method} {source}{suffix}', status == 301 and headers.get('location') == expected, [status, headers.get('location')])
            for path in ('/', *COURSES, '/quem-somos/', '/faq/', '/blog/post-example'):
                status, headers, body = request(path)
                check(f'destino ou rota atual sem loop: {path}', status == 200 and 'location' not in headers, [status, headers])
            for path in ('/blog/cursos', '/cursos-extra', '/cursos/live-class-extra/', '/outro/cursos'):
                status, headers, _ = request(path)
                check(f'nao capturar caminho fora do escopo: {path}', status == 404 and 'location' not in headers, [status, headers])
            for path in ('/guarded', '/painel/'):
                status, _, _ = request(path)
                check(f'seguranca existente preservada: {path}', status == 403, status)
            status, headers, _ = request('/cursos/', method='POST')
            check('POST nao redirecionado pelo fragmento', status != 301 and 'location' not in headers, [status, headers])
            status, headers, _ = request('/cursos/', host='preview.example')
            check('host de previa nao redirecionado pelo fragmento', status != 301 and 'location' not in headers, [status, headers])
            for path in ('/assets/css/test.css', '/assets/js/test.js?v=abc123', '/home/home-local.css?v=xyz', '/site-navigation.js?v=0123456789ab'):
                status, headers, _ = request(path)
                check(f'cache CSS/JS 1 dia: {path}', status == 200 and headers.get('cache-control') == 'public, max-age=86400', [status, headers])
            for path in ('/assets/fonts/test.woff2', '/assets/images/test.svg', '/assets/images/test.webp'):
                status, headers, _ = request(path)
                check(f'cache imagem/fonte 30 dias: {path}', status == 200 and headers.get('cache-control') == 'public, max-age=2592000', [status, headers])
            for path in ('/', '/form.php', '/rdstation-account.js', '/home/rdstation-form.js', '/assets/js/rdstation-form.js', '/blog/assets/test.css', '/assets/css/missing.css', '/assets/css/not-css.css'):
                _, headers, _ = request(path)
                check(f'sem novo cache em HTML/PHP/RD/blog/erro: {path}', 'cache-control' not in headers, headers)
            for path, expected in (('/assets/css/private.css', 'private, max-age=0'), ('/assets/css/no-store.css', 'no-store'), ('/assets/css/established.css', 'public, max-age=600')):
                _, headers, _ = request(path)
                check(f'politica de cache existente preservada: {path}', headers.get('cache-control') == expected, headers)
            for label, path, headers_in in (('Authorization', '/assets/css/test.css', {'Authorization': 'Basic Zml4dHVyZTpmaXh0dXJl'}), ('Set-Cookie', '/assets/css/cookie.css', {})):
                _, headers, _ = request(path, headers=headers_in)
                check(f'sem novo cache com {label}', 'cache-control' not in headers, headers)
            status, headers, body = request('/assets/css/test.css', headers={'Accept-Encoding': 'gzip'})
            check('compressao gzip de texto estatico negociada', status == 200 and headers.get('content-encoding') == 'gzip' and gzip.decompress(body).decode() == fixtures['assets/css/test.css'], headers)
            check('Vary Accept-Encoding preservado para compressao', 'accept-encoding' in headers.get('vary', '').lower(), headers)
            for path in ('/assets/images/test.webp', '/assets/fonts/test.woff2', '/blog/', '/form.php', '/rdstation-account.js'):
                _, headers, _ = request(path, headers={'Accept-Encoding': 'gzip'})
                check(f'sem compressao adicionada para binario/blog/PHP/RD: {path}', 'content-encoding' not in headers, headers)
            _, headers, _ = request('/assets/css/test.css')
            _, conditional, _ = request('/assets/css/test.css', headers={'If-None-Match': headers['etag']})
            check('304 conserva cache estatico esperado', conditional.get('cache-control') == 'public, max-age=86400', conditional)
            error_log = (base / 'error.log').read_text()
            check('nenhum erro de parse dos fragmentos .htaccess', 'Invalid command' not in error_log and 'syntax error' not in error_log.lower(), error_log)
        finally:
            process.terminate()
            try:
                process.communicate(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.communicate()
    return version


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--static-only', action='store_true', help='Validar apenas arquivos; nao comprova regras Apache.')
    parser.add_argument('--report', type=Path, help='Salvar relatorio JSON; por padrao imprime na saida.')
    args = parser.parse_args()
    error = None
    version = None
    try:
        package_checks()
        if not args.static_only:
            version = apache_checks()
    except Exception as exc:
        error = f'{type(exc).__name__}: {exc}'
    failures = sum(not c['ok'] for c in checks)
    report = {'scope': 'local-only; Apache em 127.0.0.1; nenhum acesso externo', 'apache': version, 'complete': not error and not args.static_only, 'checks': len(checks), 'passed': len(checks) - failures, 'failed': failures, 'error': error, 'results': checks}
    output = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(output)
    print(output)
    return 1 if error or failures else 0


if __name__ == '__main__':
    raise SystemExit(main())
