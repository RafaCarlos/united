#!/usr/bin/env python3
"""Regression tests for isolated production/preview exports; no network or form submissions."""
from pathlib import Path
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest

from lxml import html


sys.dont_write_bytecode = True
SCRIPT = Path(__file__).with_name('export-production.py')
SPEC = importlib.util.spec_from_file_location('united_export', SCRIPT)
exporter = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(exporter)
LOADER = ('https://d335luupugsy2.cloudfront.net/js/loader-scripts/'
          'ee4f0815-8266-4fb5-ba25-416836b02312-loader.js')
SDK = 'https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js'
MOUNT = 'form-vamos-conversar-5ba05329ea8c88b5c10d'


class ProductionExportTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.base = Path(self.temp.name).resolve()
        self.repo = self.base / 'repository'
        (self.repo / '.git').mkdir(parents=True)
        self.package = self.repo / 'review' / 'united-2026'
        self.dist = self.package / 'dist'
        self.seo = self.package / 'seo' / 'production'
        self.seo.mkdir(parents=True)
        self.out = self.base / 'export'
        self.write(self.dist / 'assets' / 'style.css',
                   '@import "nested.css";body{background:url("image.svg")}')
        self.write(self.dist / 'assets' / 'nested.css', 'h1{color:red}')
        self.write(self.dist / 'assets' / 'image.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>')
        self.write(self.dist / 'rdstation-form.js', f'new RDStationForms("{MOUNT}", "UA-42887237-1").createForm();')
        for route in exporter.COMMERCIAL_ROUTES:
            prefix = '../' if '/' in route else ''
            page = f'''<!DOCTYPE html><html lang="pt-BR"><head><title>United</title>
              <meta charset="utf-8"><meta name="robots" content="index,follow">
              <link rel="stylesheet" href="{prefix}assets/style.css">
              <script>window.dataLayer=window.dataLayer||[];</script></head><body>
              <!-- preserve comments and inline GTM -->
              <a href="{prefix}cursos/">Cursos</a><a href="{prefix}#contato">Contato</a>
              <a href="https://liveclass.app.br" target="_blank">Área do aluno</a>
              <img src="{prefix}assets/image.svg" srcset="{prefix}assets/image.svg 1x, {prefix}assets/image.svg 2x">
              <div class="preview-mark">PRÉVIA · UNITED</div>
              <div id="contato"><div id="{MOUNT}"></div></div>
              <a class="banner-whatsapp" href="https://api.whatsapp.com/send?phone=5511940040658">WhatsApp</a>
              <footer><a data-footer-whatsapp="parcerias" href="https://wa.me/5511958575315">Parcerias</a>
              <a data-footer-whatsapp="franquias" href="https://wa.me/5511958575315">Franqueado</a></footer>
              <script type="text/javascript" src="{LOADER}" async></script>
              <script id="rdstation-forms-sdk" src="{SDK}" defer></script>
              <script src="{prefix}rdstation-form.js" defer></script></body></html>'''
            self.write(self.dist / route, page)
        self.write(self.dist / 'comparar-contato' / 'index.html',
                   '<html><head><meta name="robots" content="noindex"></head><body>Debug</body></html>')
        self.write(self.dist / '.git' / 'config', 'private')
        self.write(self.dist / 'debug' / 'report.html', 'debug')
        self.write(self.dist / 'script.js.map', '{}')
        self.write(self.dist / 'production.php', '<?php echo "untouched"; ?>')
        self.write(self.dist / 'robots.txt', 'User-agent: *\nDisallow: /\n')
        self.write(self.seo / 'robots.txt', 'User-agent: *\nAllow: /\nSitemap: https://www.unitedidiomas.com/sitemap.xml\nSitemap: https://unitedidiomas.com/blog/sitemap_index.xml\n')
        self.write(self.seo / 'sitemap.xml', '''<?xml version="1.0" encoding="UTF-8"?>
            <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>https://www.unitedidiomas.com/</loc></url></urlset>''')
        self.write(self.seo / 'apache-seo.conf', 'Options -Indexes\n')
        self.write(self.seo / 'INSTRUCOES-PUBLICACAO.md', '# Publicação manual\n')

    def tearDown(self):
        self.temp.cleanup()

    def write(self, path, value):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(value, encoding='utf-8')

    def snapshot(self):
        return {file.relative_to(self.repo).as_posix(): file.read_bytes()
                for file in self.repo.rglob('*') if file.is_file()}

    def export(self, mode='production', force=False, output=None):
        return exporter.export_site(self.package, output or self.out, mode, force)

    def test_production_isolated_complete_and_preserves_rd(self):
        original = self.snapshot()
        report = self.export()
        self.assertEqual(self.snapshot(), original)
        self.assertEqual(report['pages'], 4)
        site = self.out / 'site'
        for route in exporter.COMMERCIAL_ROUTES:
            tree = html.parse(site / route)
            self.assertFalse(tree.xpath('//*[@class="preview-mark"]'))
            self.assertFalse(exporter.blocked_directives(tree))
            self.assertEqual(len(tree.xpath(f'//*[@id="{MOUNT}"]')), 1)
            self.assertEqual(len(tree.xpath(f'//script[@src="{LOADER}"][@async]')), 1)
            self.assertEqual(len(tree.xpath(f'//script[@src="{SDK}"][@defer]')), 1)
            self.assertEqual(tree.xpath('//a[@data-footer-whatsapp]/@href'),
                             ['https://wa.me/5511958575315'] * 2)
            self.assertEqual(len(tree.xpath('//a[contains(@href,"5511940040658")]')), 1)
            self.assertEqual(len(tree.xpath('//script[contains(text(),"window.dataLayer")]')), 1)
        self.assertEqual((site / 'rdstation-form.js').read_bytes(),
                         (self.dist / 'rdstation-form.js').read_bytes())
        for path in ('comparar-contato', '.git', 'debug', 'script.js.map', 'production.php', '.htaccess'):
            self.assertFalse((site / path).exists(), path)
        self.assertEqual((site / 'robots.txt').read_bytes(), (self.seo / 'robots.txt').read_bytes())
        self.assertTrue((self.out / 'publication' / 'apache-seo.conf').exists())
        self.assertFalse((site / 'apache-seo.conf').exists())

    def test_preview_blocks_every_html_without_mutating_production(self):
        original = self.snapshot()
        self.export('preview')
        self.assertEqual(self.snapshot(), original)
        for file in (self.out / 'site').rglob('*.html'):
            tree = html.parse(file)
            self.assertEqual(tree.xpath('//meta[@name="robots"]/@content'), ['noindex,nofollow'])
        self.assertEqual((self.out / 'site' / 'robots.txt').read_text(), 'User-agent: *\nDisallow: /\n')
        self.assertFalse((self.out / 'site' / 'sitemap.xml').exists())
        self.assertFalse((self.out / 'publication' / 'apache-seo.conf').exists())

    def test_noindex_in_production_aborts_before_output(self):
        source = self.dist / 'cursos' / 'index.html'
        self.write(source, source.read_text().replace('index,follow', 'noindex,nofollow'))
        with self.assertRaisesRegex(exporter.ExportError, 'bloqueio de indexação'):
            self.export()
        self.assertFalse(self.out.exists())

    def test_wordpress_sitemap_cannot_disappear_from_production_robots(self):
        source = self.seo / 'robots.txt'
        self.write(source, source.read_text().replace('Sitemap: https://unitedidiomas.com/blog/sitemap_index.xml\n', ''))
        with self.assertRaisesRegex(exporter.ExportError, 'sitemap do blog WordPress'):
            self.export()
        self.assertFalse(self.out.exists())

    def test_missing_resource_in_nested_page_aborts(self):
        source = self.dist / 'faq' / 'index.html'
        self.write(source, source.read_text().replace('../assets/image.svg', 'assets/image.svg'))
        with self.assertRaisesRegex(exporter.ExportError, 'destino local ausente'):
            self.export()

    def test_css_dependency_checked(self):
        self.write(self.dist / 'assets' / 'nested.css', 'body{background:url("absent.webp")}')
        with self.assertRaisesRegex(exporter.ExportError, 'absent.webp'):
            self.export()

    def test_encoded_asset_path_traversal_rejected(self):
        source = self.dist / 'faq' / 'index.html'
        self.write(source, source.read_text().replace('../assets/image.svg', '%2e%2e/%2e%2e/secrets.txt'))
        with self.assertRaisesRegex(exporter.ExportError, 'sai da raiz'):
            self.export()

    def test_output_cannot_replace_source_repo_or_ancestor_even_with_force(self):
        original = self.snapshot()
        for output in (self.repo, self.package, self.dist, self.dist / 'export', self.base):
            with self.subTest(output=output), self.assertRaises(exporter.ExportError):
                self.export(output=output, force=True)
        self.assertEqual(self.snapshot(), original)

    def test_existing_foreign_output_never_overwritten(self):
        self.write(self.out / 'important.txt', 'keep')
        with self.assertRaisesRegex(exporter.ExportError, 'só substitui uma exportação'):
            self.export(force=True)
        self.assertEqual((self.out / 'important.txt').read_text(), 'keep')

    def test_force_replaces_known_export_only_after_validation(self):
        self.export()
        prior = (self.out / 'site' / 'index.html').read_bytes()
        self.write(self.dist / 'assets' / 'nested.css', 'body{background:url("missing.png")}')
        with self.assertRaises(exporter.ExportError):
            self.export(force=True)
        self.assertEqual((self.out / 'site' / 'index.html').read_bytes(), prior)
        self.write(self.dist / 'assets' / 'nested.css', 'h1{color:blue}')
        self.export(force=True)
        self.assertEqual((self.out / 'site' / 'assets' / 'nested.css').read_text(), 'h1{color:blue}')
        self.write(self.out / 'site' / 'customer-document.txt', 'keep')
        with self.assertRaisesRegex(exporter.ExportError, 'arquivos novos'):
            self.export(force=True)
        self.assertEqual((self.out / 'site' / 'customer-document.txt').read_text(), 'keep')

    def test_source_and_output_symlinks_rejected(self):
        link = self.dist / 'assets' / 'outside.txt'
        link.symlink_to(self.seo / 'robots.txt')
        with self.assertRaisesRegex(exporter.ExportError, 'Link simbólico em dist'):
            self.export()
        link.unlink()
        self.out.symlink_to(self.dist, target_is_directory=True)
        with self.assertRaisesRegex(exporter.ExportError, 'link simbólico'):
            self.export(force=True)

    def test_production_robots_and_sitemap_rejected_if_blocked_or_preview(self):
        self.write(self.seo / 'robots.txt', 'User-agent: *\nDisallow: /\n')
        with self.assertRaisesRegex(exporter.ExportError, 'bloqueia a raiz'):
            self.export()
        self.write(self.seo / 'robots.txt', 'Sitemap: https://www.unitedidiomas.com/sitemap.xml\nSitemap: https://unitedidiomas.com/blog/sitemap_index.xml\n')
        self.write(self.seo / 'sitemap.xml', '<urlset><url><loc>https://www.unitedidiomas.com/review/</loc></url></urlset>')
        with self.assertRaisesRegex(exporter.ExportError, 'URL imprópria'):
            self.export()

    def test_mode_required_on_cli(self):
        process = subprocess.run([sys.executable, str(SCRIPT), '--output', str(self.out)],
                                 capture_output=True, text=True)
        self.assertEqual(process.returncode, 2)
        self.assertIn('--mode', process.stderr)
        self.assertFalse(self.out.exists())


if __name__ == '__main__':
    unittest.main(verbosity=2)
