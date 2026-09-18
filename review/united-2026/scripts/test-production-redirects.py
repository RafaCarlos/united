"""Check the proposed redirect map and fragment without changing a web server.

Python emulates only the small RewriteCond/RewriteRule subset used here, not
Apache itself. --apache-syntax additionally runs httpd -t with a temporary copy
and known local modules; it does not start a listener or use system config.
The real hosting .htaccess, TLS proxy and PHP/WordPress remain integration checks.
"""
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from urllib.parse import unquote, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'seo/production/redirects.json').read_text())
CONF = (ROOT / 'seo/production/apache-seo.conf').read_text()
ACTIVE = [line.strip() for line in CONF.splitlines()
          if line.strip() and not line.lstrip().startswith('#')]
RULES = []
conditions = []
for line in ACTIVE:
    if line.startswith('RewriteCond '):
        conditions.append(line.split()[1:])
    elif line.startswith('RewriteRule '):
        pattern, target, flags = line.split()[1:]
        RULES.append((conditions, pattern, target, flags))
        conditions = []


def redirect(url, method='GET', original_request=None):
    """Small deterministic check of these literal rules, not an Apache runtime."""
    parsed = urlsplit(url)
    values = {'%{HTTP_HOST}': parsed.netloc, '%{REQUEST_URI}': unquote(parsed.path),
              '%{REQUEST_METHOD}': method,
              '%{THE_REQUEST}': original_request or f'{method} {parsed.path}' +
                  (f'?{parsed.query}' if parsed.query else '') + ' HTTP/1.1'}
    for guards, pattern, target, flags in RULES:
        allowed = True
        for guard in guards:
            variable, condition, *options = guard
            insensitive = bool(options and 'NC' in options[0])
            inverse = condition.startswith('!')
            condition = condition[1:] if inverse else condition
            matched = bool(re.search(condition, values[variable], re.I if insensitive else 0))
            allowed = allowed and (not matched if inverse else matched)
        match = re.search(pattern, unquote(parsed.path).lstrip('/'))
        if not allowed or not match:
            continue
        assert 'R=301' in flags and 'L' in flags
        target = re.sub(r'\$(\d)', lambda m: match.group(int(m[1])), target)
        target = target.replace('%{REQUEST_URI}', parsed.path)
        destination = urlsplit(target)
        return urlunsplit(destination._replace(query=parsed.query))
    return None


class Ids(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []

    def handle_starttag(self, tag, attrs):
        self.ids.extend(value for name, value in attrs if name == 'id')


def uri_pattern(header_line):
    return re.search(r'REQUEST_URI\} =~ m#(.*?)#', header_line)[1]


class RedirectChecks(unittest.TestCase):
    def test_each_known_legacy_url_has_one_canonical_hop(self):
        for entry in DATA['redirects']:
            self.assertNotEqual(entry['to'], '/')
            self.assertEqual(entry['status'], 301)
            for host in DATA['scope']['hosts']:
                for scheme in ('http', 'https'):
                    for slash in ('', '/'):
                        for method in ('GET', 'HEAD'):
                            url = f"{scheme}://{host}{entry['from']}{slash}?utm_source=seo&x=1"
                            target = urlsplit(DATA['canonical_origin'] + entry['to'])
                            expected = urlunsplit(target._replace(query='utm_source=seo&x=1'))
                            with self.subTest(url=url, method=method):
                                self.assertEqual(redirect(url, method), expected)
                                self.assertIsNone(redirect(expected, method))

    def test_targets_and_fragments_exist_once_in_current_html(self):
        for entry in DATA['redirects'] + DATA['normalizations']:
            target = urlsplit(entry['to'])
            page = ROOT / 'dist' / target.path.strip('/') / 'index.html'
            self.assertTrue(page.is_file(), str(page))
            if target.fragment:
                parsed = Ids()
                parsed.feed(page.read_text())
                self.assertEqual(parsed.ids.count(target.fragment), 1, entry['to'])

    def test_normalization_has_no_home_fallback(self):
        for entry in DATA['normalizations']:
            self.assertEqual(redirect(DATA['canonical_origin'] + entry['from']),
                             DATA['canonical_origin'] + entry['to'])
        self.assertIsNone(redirect(DATA['canonical_origin'] + '/url-inexistente-teste-seo'))

    def test_index_file_aliases_preserve_campaign_and_skip_internal_directory_index(self):
        for path in ('/', '/cursos/', '/quem-somos/', '/faq/'):
            for host in DATA['scope']['hosts']:
                for method in ('GET', 'HEAD'):
                    self.assertEqual(redirect(f'http://{host}{path}index.html?utm_source=organic', method),
                                     DATA['canonical_origin'] + path + '?utm_source=organic')
            self.assertIsNone(redirect(DATA['canonical_origin'] + path + 'index.html',
                                      original_request=f'GET {path} HTTP/1.1'))
            self.assertIsNone(redirect(DATA['canonical_origin'] + path + 'index.html', 'POST'))
        for path in ('/blog/index.html', '/review/united-2026/dist/index.html', '/assets/index.html'):
            self.assertIsNone(redirect(DATA['canonical_origin'] + path))

    def test_mapping_does_not_claim_closed_units_without_confirmation(self):
        self.assertEqual(DATA['retired'], [])
        mapped = {row['from'] for row in DATA['redirects']}
        pending = {row['from'] for row in DATA['needs_review']}
        self.assertEqual(len(mapped), len(DATA['redirects']))
        self.assertFalse(mapped & pending)
        self.assertEqual(len(mapped) + len(pending), 45)
        for row in DATA['needs_review']:
            self.assertEqual(row['status'], 'needs-review')
            self.assertEqual(row['sitemap'], 'exclude-until-valid-canonical')
            self.assertIsNone(redirect(DATA['canonical_origin'] + row['from']))

    def test_out_of_scope_hosts_and_post_are_preserved(self):
        for host in ('localhost:8767', '127.0.0.1:8767', 'staging.unitedidiomas.com',
                     'unitedidiomas.com.evil.example', 'example.com'):
            for row in DATA['redirects']:
                self.assertIsNone(redirect(f"http://{host}{row['from']}"))
        for row in DATA['redirects']:
            for method in ('POST', 'PUT', 'OPTIONS'):
                self.assertIsNone(redirect(DATA['canonical_origin'] + row['from'], method))

    def test_blog_and_preview_never_change_domain_or_path(self):
        for host in DATA['scope']['hosts']:
            for path in ('/blog', '/blog/', '/blog/wp-login.php', '/blog/um-artigo/',
                         '/review', '/review/united-2026/dist/cursos/'):
                self.assertIsNone(redirect('http://' + host + path))
        self.assertEqual(redirect('http://unitedidiomas.com/faq/?utm_source=test'),
                         'https://www.unitedidiomas.com/faq/?utm_source=test')
        # Scheme enforcement is intentionally opt-in until the real TLS topology is known.
        self.assertIsNone(redirect('http://www.unitedidiomas.com/faq/'))

    def test_preview_noindex_is_scoped(self):
        line = next(line for line in ACTIVE if 'X-Robots-Tag' in line)
        pattern = uri_pattern(line)
        for path in ('/review', '/review/united-2026/dist/', '/comparar-contato/',
                     '/comparar-contato/index.html'):
            self.assertRegex(path, pattern)
        for path in ('/', '/cursos/', '/quem-somos/', '/faq/', '/blog/', '/reviewer/'):
            self.assertNotRegex(path, pattern)
        self.assertEqual(sum('X-Robots-Tag' in line for line in ACTIVE), 1)

    def test_long_cache_only_for_hashed_css_and_valid_responses(self):
        line = next(line for line in ACTIVE if 'immutable' in line)
        pattern = uri_pattern(line)
        self.assertRegex('/assets/css/page-quem-somos-012345abcdef.css', pattern)
        for path in ('/', '/cursos/', '/assets/css/page-home.css', '/rdstation-form.js',
                     '/blog/style.css', '/assets/images/foto.webp'):
            self.assertNotRegex(path, pattern)
        self.assertIn('REQUEST_STATUS} =~ m#^(200|304)$#', line)
        self.assertTrue(any('setifempty Cache-Control "no-cache"' in line for line in ACTIVE))
        image_line = next(line for line in ACTIVE if 'max-age=604800' in line)
        self.assertRegex('/assets/images/bg-united-video.webp', uri_pattern(image_line))
        self.assertRegex('/assets/fonts/Manrope-Bold.woff2', uri_pattern(image_line))
        self.assertNotRegex('/blog/foto.webp', uri_pattern(image_line))


def apache_syntax():
    binary = shutil.which('httpd') or shutil.which('apache2')
    if binary is None and Path('/usr/sbin/httpd').is_file():
        binary = '/usr/sbin/httpd'
    modules = next((path for path in (Path('/usr/libexec/apache2'), Path('/usr/lib/apache2/modules'))
                    if (path / 'mod_rewrite.so').is_file()), None)
    if not binary or not modules:
        raise SystemExit('Apache/modules unavailable: syntax check was NOT performed.')
    with tempfile.TemporaryDirectory(prefix='united-apache-syntax-') as folder:
        tmp = Path(folder)
        (tmp / 'www').mkdir()
        (tmp / 'apache-seo.conf').write_text(CONF)
        conf = [f'ServerRoot "{tmp}"', f'PidFile "{tmp}/httpd.pid"',
                'ServerName localhost', 'Listen 127.0.0.1:18768',
                f'ErrorLog "{tmp}/error.log"']
        for module in ('mpm_prefork', 'authz_core', 'unixd', 'rewrite', 'headers', 'filter', 'deflate'):
            module_path = modules / f'mod_{module}.so'
            if module_path.is_file():
                conf.append(f'LoadModule {module}_module "{module_path}"')
        conf += [f'DocumentRoot "{tmp}/www"', f'<Directory "{tmp}/www">',
                 'Require all granted', 'AllowOverride FileInfo',
                 f'Include "{tmp}/apache-seo.conf"', '</Directory>']
        config_path = tmp / 'httpd.conf'
        config_path.write_text('\n'.join(conf) + '\n')
        subprocess.run([binary, '-t', '-f', str(config_path)], check=True)
    print('Apache syntax checked in an isolated temporary Directory context; no server started.')


if __name__ == '__main__':
    if '--apache-syntax' in sys.argv:
        sys.argv.remove('--apache-syntax')
        apache_syntax()
    unittest.main()
