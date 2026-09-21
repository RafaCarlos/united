"""Regression checks for the production crawl contract, without network access.

This deliberately supports only our single universal group and literal prefixes.
Google chooses the longest matching Allow/Disallow prefix (Allow wins a tie).
If a future change introduces wildcards, agent-specific groups or other syntax,
the test fails for review rather than pretending to model the complete crawler.
Passing proves local rules/content consistency, not a Google crawl or indexing.
"""
from html.parser import HTMLParser
import json
from pathlib import Path
import unittest
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET
from crawl_policy import permits, policy, validate_production_robots


ROOT = Path(__file__).resolve().parents[1]
PRODUCTION = ROOT / 'seo/production'
DIST = ROOT / 'dist'
META = json.loads((ROOT / 'seo/metadata.json').read_text())


class PageHead(HTMLParser):
    def __init__(self):
        super().__init__()
        self.robots = []
        self.canonicals = []

    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        if tag == 'meta' and attrs.get('name', '').lower() in (
                'robots', 'googlebot', 'googlebot-news', 'googlebot-image', 'bingbot'):
            self.robots.append(attrs.get('content', '').lower())
        if tag == 'link' and attrs.get('rel', '').lower() == 'canonical':
            self.canonicals.append(attrs.get('href'))


class ProductionCrawlChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.text = (PRODUCTION / 'robots.txt').read_text()
        cls.rules, cls.sitemaps = policy(cls.text)

    def test_export_contract_accepts_all_public_files(self):
        paths = ['/' + path.relative_to(DIST).as_posix()
                 for path in DIST.rglob('*') if path.is_file()]
        validate_production_robots(self.text, paths)

    def test_googlebot_specific_block_cannot_slip_past_universal_allow(self):
        for path in ('/cursos/', '/assets/'):
            with self.subTest(path=path), self.assertRaisesRegex(ValueError, 'User-agent'):
                validate_production_robots(self.text + f'\nUser-agent: Googlebot\nDisallow: {path}\n')

    def test_accidental_public_blocks_are_rejected(self):
        for path in ('/', '/cursos/', '/assets/', '/assets/images/banner.webp',
                     '/blog/', '/blog/um-artigo/', '/review/'):
            with self.subTest(path=path), self.assertRaises(ValueError):
                validate_production_robots(self.text + f'Disallow: {path}\n')

    def test_unsupported_syntax_requires_explicit_review(self):
        for line in ('Disallow: /*', 'Disallow: /cursos/$', 'Disallow: /%63ursos/',
                     'Disallow: /cursos/?x=1', 'Crawl-delay: 10', 'Noindex: /review/'):
            with self.subTest(line=line), self.assertRaises(ValueError):
                validate_production_robots(self.text + line + '\n')

    def test_prefix_specificity_and_case_are_not_first_match_rules(self):
        rules, _ = policy('User-agent: *\nAllow: /\nDisallow: /pasta/\nAllow: /pasta/publico/\n')
        self.assertFalse(permits(rules, '/pasta/privado/'))
        self.assertFalse(permits(rules, '/%70asta/privado/'))
        self.assertTrue(permits(rules, '/pasta/publico/'))
        self.assertTrue(permits(rules, '/Pasta/privado/'))
        self.assertTrue(permits(rules, '/pasta%2Fprivado/'))
        tie = [('/pasta/', False), ('/pasta/', True)]
        self.assertTrue(permits(tie, '/pasta/'))

    def test_single_universal_policy_has_no_hidden_googlebot_restriction(self):
        # The parser rejects every extra/specific user-agent group; this contract
        # is shared by Googlebot, Googlebot-Image, Bingbot and ordinary REP bots.
        self.assertTrue(self.rules)
        self.assertFalse(any(prefix == '/' and not allow for prefix, allow in self.rules))

    def test_all_commercial_pages_are_allowed_with_tracking_queries(self):
        for host in ('www.unitedidiomas.com', 'unitedidiomas.com'):
            for route in META:
                for suffix in ('', '?utm_source=google&utm_medium=organic'):
                    url = f'https://{host}{route}{suffix}'
                    with self.subTest(url=url):
                        self.assertTrue(permits(self.rules, url))

    def test_blog_posts_and_rendering_assets_remain_accessible(self):
        for path in ('/blog/', '/blog/ingles-online/', '/blog/category/ingles/',
                     '/blog/wp-content/uploads/2026/09/aula.webp',
                     '/blog/wp-content/themes/united/style.css?ver=1.0',
                     '/blog/wp-includes/js/jquery/jquery.min.js?ver=3.7.1',
                     '/assets/css/page-home-0123456789ab.css',
                     '/assets/images/bg-united-video.webp',
                     '/assets/fonts/inter.woff2', '/assets/js/rdstation-form.js'):
            with self.subTest(path=path):
                self.assertTrue(permits(self.rules, path))

    def test_admin_is_blocked_but_public_ajax_is_allowed(self):
        for path in ('/blog/wp-admin/', '/blog/wp-admin/index.php',
                     '/blog/wp-admin/edit.php?post_type=post'):
            with self.subTest(path=path):
                self.assertFalse(permits(self.rules, path))
        for suffix in ('', '?action=public_widget'):
            self.assertTrue(permits(self.rules, '/blog/wp-admin/admin-ajax.php' + suffix))

    def test_removal_urls_can_be_recrawled_to_see_noindex_or_http_status(self):
        for path in ('/review/', '/review/united-2026/dist/',
                     '/review/united-2026/dist/faq/', '/comparar-contato/',
                     '/obrigado/', '/pagina-removida/'):
            with self.subTest(path=path):
                self.assertTrue(permits(self.rules, path))

    def test_both_sitemaps_are_discoverable_and_rastreable(self):
        self.assertEqual(set(self.sitemaps), {
            'https://www.unitedidiomas.com/sitemap.xml',
            'https://unitedidiomas.com/blog/sitemap_index.xml',
        })
        self.assertEqual(len(self.sitemaps), 2)
        for url in self.sitemaps:
            self.assertTrue(permits(self.rules, url))
        self.assertTrue(permits(self.rules, '/blog/post-sitemap.xml'))

    def test_sitemap_pages_are_canonical_indexable_and_exist(self):
        sitemap = ET.parse(PRODUCTION / 'sitemap.xml')
        locations = [element.text for element in sitemap.iter()
                     if element.tag.rsplit('}', 1)[-1] == 'loc']
        self.assertEqual(set(locations), {'https://www.unitedidiomas.com' + route for route in META})
        self.assertEqual(len(locations), len(set(locations)))
        for url in locations:
            with self.subTest(url=url):
                self.assertTrue(permits(self.rules, url))
                path = DIST / urlsplit(url).path.strip('/') / 'index.html'
                parser = PageHead()
                parser.feed(path.read_text())
                self.assertEqual(parser.canonicals, [url])
                self.assertTrue(parser.robots, 'An explicit production indexing policy is required.')
                for directives in parser.robots:
                    self.assertFalse({'none', 'noindex', 'nofollow'} &
                                     {part.strip() for part in directives.split(',')})

    def test_generated_crawl_files_match_production_sources(self):
        for name in ('robots.txt', 'sitemap.xml'):
            self.assertEqual((DIST / name).read_bytes(), (PRODUCTION / name).read_bytes())


if __name__ == '__main__':
    unittest.main()
